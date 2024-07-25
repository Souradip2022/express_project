// const express = require("express")
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Allows specific client domain origin access or an array of origin access from server
    credentials: true, // This option allows the server to accept requests that include credentials like cookies, authorization headers, or TLS client certificates.
  }),
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import { router as userRouter } from "./routes/user.routes.js";

// route declaration
app.use("/api/v1/users", userRouter);
// http://localhost:8000/api/v1/users/

export { app };
