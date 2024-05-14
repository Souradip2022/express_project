import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: true});

    return {accessToken, refreshToken};
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
}

const registerUser = asyncHandler(async (req, res) => {

  // get user details from frontend
  // validation - not empty
  // check whether the user is already registered using username and email
  // check for images and check for avatars
  // upload avatar and coverImage to cloudinary
  // create an user object and upload to db
  // remove password and refresh token filed from response
  // check user
  // return res

  // console.log(fullName);generateAccessTokenAndRefreshToken

  const {fullName, email, username, password} = req.body;
  // console.table([username, email, password]);

  if (!fullName || !email || !username || !password || [fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{username}, {email}]
  });

  // console.log(User);

  if (existingUser) {
    throw new ApiError(409, "user with email or username already exists");
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImagePath = req.files?.coverImage[0]?.path;
  // console.log(req.files.coverImage.length); // cannot read properties of undefined

  let avatarLocalPath;
  if (req.files && Array.isArray(req.files.avatar) && (req.files.avatar.length > 0)) {
    avatarLocalPath = req.files.avatar[0].path;
  } else {
    throw new ApiError(400, "Avatar file required");
  }

  let coverImagePath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImagePath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImagePath);
  // console.log(avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar file not uploaded to cloudinary");
  }


  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res.status(200).json(new ApiResponse(200, createdUser, "User registered Successfully"));
});


const loginUser = asyncHandler(async (req, res) => {
  // req body data
  // get username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const {username, email, password} = req.body;
  console.table([username, email, password]);

  if (!username || !email || !password || [username, email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields required");
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const option = {
    httpOnly: true,
    secure: true
  }
  // console.log(refreshToken,"\n\n", accessToken)

  /*res.header("X-User", `${username}`)
    .header("Authorization", `Bearer ${accessToken}`);*/

  return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
      )
    );
});


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const option = {
    httpOnly: true,
    secure: true
  }

  // res.removeHeader("Authorization");

  return res.status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});


const refreshTokenGenerator = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_EXPIRY);

    if (!decodedToken) {
      throw new ApiError(401, "Refresh token expired or used");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid user");
    }

    const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id);

    const option = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(200,
          {accessToken, refreshToken: newRefreshToken},
          "accessToken refreshed successfully")
      );

  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong");
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

  const {oldPassword, newPassword} = req.body;

  if (!oldPassword || !newPassword || [oldPassword, newPassword].some((field) => field.trim() !== "")) {
    throw new ApiError(400, "All fields required");
  }

  const user = await User.findById(req?._id);
  if (!user) {
    throw new ApiError(400, "Invalid user");
  }

  if (!await user.isPasswordCorrect(oldPassword)) {
    throw new ApiError(400, "Incorrect user credentials");
  } else {
    user.password = newPassword;
    user.save({validateBeforeSave: false});
  }

  return res.status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokenGenerator,
  changeCurrentPassword
};