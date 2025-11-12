import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cors from "cors";

import { isDevMode } from "../utils/index.js";

// ==========================================
// 1. RATE LIMITING - Prevent Brute Force & DDoS
// ==========================================
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Stricter rate limit for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later.",
});

// ==========================================
// 2. HELMET - Security Headers
// ==========================================
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
});

// ==========================================
// 3. CORS - Cross-Origin Resource Sharing
// ==========================================
const allowedOrigins = [
  isDevMode && `http://localhost:${process.env.PORT}`,
].filter(Boolean);

export const corsOptions = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
});

// ==========================================
// 4. INPUT SANITIZATION
// ==========================================

// NoSQL Injection Prevention
export const noSqlInjectionProtection = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL injection attempt detected: ${key} from IP: ${req.ip}`);
  },
});

// XSS Protection - Clean user input
export const xssProtection = xss();

// HTTP Parameter Pollution Protection
export const hppProtection = hpp({
  whitelist: ["sort", "filter", "page", "limit"], // Allow duplicate params for these
});

// ==========================================
// 5. CUSTOM SECURITY MIDDLEWARE
// ==========================================

// SQL Injection Pattern Detection (in case you use raw queries)
export const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /('|"|`)(.*?)(OR|AND)(.*?)('|"|`)/gi,
  ];

  const checkValue = (value) => {
    if (typeof value === "string") {
      return sqlPatterns.some((pattern) => pattern.test(value));
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  const sources = [req.body, req.query, req.params];

  for (const source of sources) {
    if (source && checkValue(source)) {
      console.warn("SQL injection attempt detected:", req.ip);
      return res.status(400).json({
        success: false,
        error: "Invalid input detected",
      });
    }
  }

  next();
};

// Path Traversal Protection
export const pathTraversalProtection = (req, res, next) => {
  const pathPatterns = [
    /\.\./g,
    /\.\.\/|\.\.\\|%2e%2e/gi,
    /\/etc\/passwd|\/windows\/system32/gi,
  ];

  const checkPath = (value) => {
    if (typeof value === "string") {
      return pathPatterns.some((pattern) => pattern.test(value));
    }
    return false;
  };

  const allParams = { ...req.params, ...req.query, ...req.body };

  if (Object.values(allParams).some(checkPath)) {
    console.warn("Path traversal attempt detected:", req.ip);
    return res.status(400).json({
      success: false,
      error: "Invalid path detected",
    });
  }

  next();
};

// Request Size Limiter - Prevent payload attacks
export const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.headers["content-length"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      error: "Request payload too large",
    });
  }

  next();
};

// ==========================================
// 6. BOT PROTECTION
// ==========================================

// Bot Detection - User Agent Analysis
const botUserAgents = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /java/i,
  /selenium/i,
  /phantom/i,
  /headless/i,
  /scrapy/i,
  /postman/i,
  /httpclient/i,
  /apache-http/i,
  /okhttp/i,
  /go-http/i,
];

const legitimateBots = [
  /googlebot/i,
  /bingbot/i,
  /slackbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegram/i,
  /discord/i,
];

export const botProtection = (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.connection.remoteAddress;

  // Allow legitimate bots (search engines, social media)
  if (legitimateBots.some((pattern) => pattern.test(userAgent))) {
    return next();
  }

  // Check for malicious bots
  const isBotUA = botUserAgents.some((pattern) => pattern.test(userAgent));

  // Check for missing or suspicious user agent
  const isSuspiciousUA = !userAgent || userAgent.length < 10;

  // Check for bot-like behavior patterns
  const hasNoReferer = !req.headers.referer && req.method === "POST";
  const hasNoAcceptHeader = !req.headers.accept;
  const hasNoAcceptLanguage = !req.headers["accept-language"];

  if (
    isBotUA ||
    (isSuspiciousUA &&
      (hasNoReferer || hasNoAcceptHeader || hasNoAcceptLanguage))
  ) {
    console.warn(`Bot detected - IP: ${ip}, UA: ${userAgent}`);

    return res.status(403).json({
      success: false,
      error: "Access denied",
      message: "Automated access is not permitted",
    });
  }

  next();
};

// Honeypot Field Protection
export const honeypotProtection = (req, res, next) => {
  // Check for common honeypot field names in POST requests
  const honeypotFields = [
    "website",
    "url",
    "homepage",
    "email_confirm",
    "phone_confirm",
  ];

  if (req.method === "POST" && req.body) {
    for (const field of honeypotFields) {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        console.warn(`Honeypot triggered - IP: ${req.ip}, Field: ${field}`);

        // Silently reject with delay to confuse bots
        return setTimeout(() => {
          res.status(400).json({ success: false, error: "Invalid submission" });
        }, 3000);
      }
    }
  }

  next();
};

// Behavior Analysis - Detect automated patterns
const requestPatterns = new Map(); // Use Redis in production

export const behaviorAnalysis = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const timeWindow = 60000; // 1 minute

  if (!requestPatterns.has(ip)) {
    requestPatterns.set(ip, []);
  }

  const patterns = requestPatterns.get(ip);

  // Clean old entries
  const recentPatterns = patterns.filter((p) => now - p.time < timeWindow);

  // Add current request
  recentPatterns.push({
    time: now,
    path: req.path,
    method: req.method,
  });

  requestPatterns.set(ip, recentPatterns);

  // Detect suspicious patterns
  const requestsPerMinute = recentPatterns.length;
  const uniquePaths = new Set(recentPatterns.map((p) => p.path)).size;
  const pathToRequestRatio = uniquePaths / requestsPerMinute;

  // Bot indicators:
  // 1. Too many requests in short time
  // 2. Accessing too many different paths (scanning)
  // 3. Repeated identical requests (automation)
  const isSuspicious =
    requestsPerMinute > 30 ||
    (requestsPerMinute > 15 && pathToRequestRatio > 0.8) ||
    (requestsPerMinute > 10 && pathToRequestRatio < 0.2);

  if (isSuspicious) {
    console.warn(
      `Suspicious behavior - IP: ${ip}, RPM: ${requestsPerMinute}, Ratio: ${pathToRequestRatio.toFixed(
        2
      )}`
    );

    return res.status(429).json({
      success: false,
      error: "Suspicious activity detected",
      message: "Please slow down your requests",
    });
  }

  next();
};

// Browser Fingerprinting Check
export const browserFingerprintCheck = (req, res, next) => {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const headers = req.headers;

  // Real browsers typically send these headers
  const browserHeaders = [
    "accept",
    "accept-language",
    "accept-encoding",
    "user-agent",
  ];

  const missingHeaders = browserHeaders.filter((h) => !headers[h]);

  // Real browsers typically send DNT or Sec-Fetch headers
  const hasModernHeaders =
    headers["sec-fetch-site"] ||
    headers["sec-fetch-mode"] ||
    headers["sec-ch-ua"];

  if (missingHeaders.length > 2 && !hasModernHeaders) {
    console.warn(
      `Suspicious headers - IP: ${req.ip}, Missing: ${missingHeaders.join(
        ", "
      )}`
    );
    return res.status(403).json({
      success: false,
      error: "Invalid request headers",
    });
  }

  next();
};

// Request Logging for Security Monitoring
export const securityLogger = (req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,
    /<script>/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /eval\(/i,
    /document\.cookie/i,
  ];

  const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
  const isSuspicious = suspiciousPatterns.some((p) => p.test(requestString));

  if (isSuspicious) {
    console.warn("Suspicious request detected:", logData);
  }

  next();
};

// ==========================================
// 7. COMBINED MIDDLEWARE STACK
// ==========================================
export const applySecurityMiddleware = (app) => {
  // Core security headers (MUST BE FIRST)
  app.use(securityHeaders);
  app.use(corsOptions);

  // Bot protection layer (EARLY REJECTION)
  app.use(botProtection);
  app.use(browserFingerprintCheck);
  app.use(behaviorAnalysis);
  app.use(honeypotProtection);

  // Rate limiting
  app.use(rateLimiter);
  app.use(requestSizeLimiter);

  // Input sanitization & injection protection
  app.use(noSqlInjectionProtection);
  app.use(xssProtection);
  app.use(hppProtection);
  app.use(sqlInjectionProtection);
  app.use(pathTraversalProtection);

  // Security logging (SHOULD BE LAST)
  app.use(securityLogger);

  console.log("✅ Security middleware applied");
};
