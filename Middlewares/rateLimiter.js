import rateLimit from "express-rate-limit";


const rateLimitHandler = (req, res) => {
  return res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};


export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message:
        "Too many authentication attempts. Please try again after 15 minutes.",
    });
  },
});


export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many upload requests. Please try again later.",
    });
  },
});


export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many messages sent. Please slow down.",
    });
  },
});



