import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// localFilePath is a parameter for the uploadCloudinary function. It represents the path to a file stored on the local file system that you want to upload to Cloudinary.

const uploadCloudinary = async (localFilePath) => {
  try{
    if(!localFilePath) return null;

    const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })

    console.log("File upload successfully on cloudinary ", uploadResponse.url);

    // remove locally saved files after getting uploaded successfully
    fs.unlinkSync(localFilePath);
    return uploadResponse;
  }
  catch(error) {
    console.warn("File upload failed !!!", error);
    // remove locally saved temporary files if upload fails
    fs.unlinkSync(localFilePath);
    return null;
  }
}

