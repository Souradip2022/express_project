import {User} from "../models/users.model.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const incomingAccessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");
    console.log(incomingAccessToken);

    if (!incomingAccessToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(incomingAccessToken, process.env.ACCESS_TOKEN_SECRET);
    console.log(decodedToken);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();

  } catch (error) {
    throw new ApiError(401, error.message || "Invalid access token");
  }
});

export {verifyJWT};