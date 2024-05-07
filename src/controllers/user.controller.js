import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  /*
  res.status(200).json({
    success: true,
    message: "ok"
  })*/

  // get user details from frontend
  // validation - not empty
  // check whether the user is already registered using username and email
  // check for images and check for avatars
  // upload avatar and coverImage to cloudinary
  // create an user object and upload to db
  // remove password and refresh token filed from response
  // check user
  // return res
  // console.log(fullName);


  const {fullName, email, username, password} = req.body;

  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  // this.username = username.toLowerCase();
  const existingUser = await User.findOne({
    $or: [{username}, {email}]
  });

  if (existingUser) {
    throw new ApiError(409, "user with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImagePath = req.files?.coverImage[0]?.path;

  // console.log(avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImagePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file not uploaded to cloudinary");
  }


  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"));

});


export {registerUser};
