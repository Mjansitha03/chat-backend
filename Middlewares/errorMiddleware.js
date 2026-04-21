const errorMiddleware = (err, req, res, next) => {
  console.log("🔥 ERROR:", err);

  let statusCode = err.statusCode || res.statusCode || 500;
  let message = err.message || "Internal Server Error";

 
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field || "Field"} already exists`;
  }


  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

 
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;




