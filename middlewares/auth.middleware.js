import jwt from "jsonwebtoken";
import User from "../models/mongoose/user.model.js";

const authMiddleware = async (req, res, next) => {
  // Authentication logic here
  try {
    let token;

    if (req?.headers?.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "No token provided" });
    }

    // Verify token and extract user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    return res.status(401).json(error);
  }
};
export default authMiddleware;
