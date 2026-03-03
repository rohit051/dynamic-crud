
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dynamicRoutes from "./routes/dynamicRoutes";
import authRoutes from "./routes/authRoutes";
import authMiddleware from "./middleware/authMiddleware";
import "./models";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// public auth endpoints
app.use("/api/auth", authRoutes);

// protect API (dynamic CRUD) with JWT middleware
app.use("/api", authMiddleware, dynamicRoutes);

mongoose.connect(process.env.MONGO_URI!)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port 5000")
);
