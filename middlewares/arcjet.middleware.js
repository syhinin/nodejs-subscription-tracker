import arcjetConfig from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await arcjetConfig.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      console.warn("Request denied by Arcjet:", decision.reason);

      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          success: false,
          error: "Too many requests - Rate limit exceeded",
        });
      }

      if (decision.reason.isBot()) {
        return res.status(403).json({
          success: false,
          error: "Bot detected - Access denied",
        });
      }

      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    next();
  } catch (error) {
    console.error("Arcjet middleware error:", error);
    next(error);
  }
};

export default arcjetMiddleware;
