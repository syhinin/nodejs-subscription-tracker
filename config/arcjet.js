import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";

import { isDevMode } from "../utils/index.js";

const arcjetConfig = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    detectBot({
      mode: isDevMode ? "DRY_RUN" : "LIVE",
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord

        ...(isDevMode ? ["JAVASCRIPT_AXIOS", "UNKNOWN"] : []),
      ],
    }),
    // Create a token bucket rate limit. Each IP address gets its own bucket
    tokenBucket({
      mode: "LIVE",
      // Tracked by IP address by default
      // See https://docs.arcjet.com/fingerprints
      //characteristics: ["ip.src"],
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
  ],
});

export default arcjetConfig;
