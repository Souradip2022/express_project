// require('dotenv').config({path: './.env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import path from "path";
import {app} from "./app.js";

dotenv.config({path: '../.env'});

connectDB().then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log("Server running successfully at: ", process.env.PORT);
  })
});
