import express from "express";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import {connectDB} from "./lib/db.js";

const app = express();
app.use(express.json());

const PORT = process.config.PORT || 5000;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Listening on PORT = ${PORT}`);
    connectDB();
});