import express from "express";
import bcrypt from "bcrypt";
import Candidate from "../MongoDb/Candidate.js";

const router = express.Router();

// Candidate registration
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if candidate exists
    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      return res.status(400).json({
        message: "Candidate with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique candidateId
    const candidateId = `CAND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create candidate
    const newCandidate = new Candidate({
      candidateId,  // ADD THIS
      name,
      email,
      password: hashedPassword,
      score: 0,  // Default values
      testCompleted: false,
      answers: [],
      traitScores: {
        Openness: 0,
        Conscientiousness: 0,
        Extraversion: 0,
        Agreeableness: 0,
        "Emotional Stability": 0
      },
      recommendedDepartment: "Pending"
    });

    await newCandidate.save();

    const candidateResponse = {
      _id: newCandidate._id,
      candidateId: newCandidate.candidateId,  // RETURN THIS
      name: newCandidate.name,
      email: newCandidate.email,
      testCompleted: newCandidate.testCompleted,
      score: newCandidate.score,
    };

    res.status(201).json({
      message: "Registration successful",
      candidate: candidateResponse,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering candidate",
      error: error.message,
    });
  }
});

export default router;