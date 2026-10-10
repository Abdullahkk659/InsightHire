import express from "express";
import cors from "cors";
import { connectDB } from "./MongoDb/Db.js";

import SignIn from "./routes/UserSignIn.js";
import LogIn from "./routes/UserLogin.js";
import hrDashboardRoutes from "./routes/HRDashboard.js";
import questionRoutes from "./routes/questions.js"

const app = express();
const port = 8000;

// Connect to DB
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/SignIn", SignIn);
app.use("/api/LoginIn", LogIn);
app.use("/api", hrDashboardRoutes); // This includes both candidates and submit-test routes
app.use('/api', questionRoutes)
app.get("/", (req, res) => res.send("Backend is running"));

app.listen(port, () => console.log(`Server running on port ${port}`));