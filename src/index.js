// require('dotenv').config({path: './.env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import * as path from "node:path";

dotenv.config({path: './.env'});

connectDB();