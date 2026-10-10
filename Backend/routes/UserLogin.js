import express from "express";
import bcrypt from "bcrypt";
import Candidate from "../MongoDb/Candidate.js";

const router = express.Router();

// User login
router.post("/", async (req, res) => {
  const { firstName, password } = req.body;

  if (!firstName || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Search for candidate by name (case-insensitive)
    const candidate = await Candidate.findOne({
      name: new RegExp(`^${firstName}`, 'i')
    });

    if (!candidate) {
      return res.status(400).json({ error: "User does not exist!" });
    }

    const match = await bcrypt.compare(password, candidate.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      candidateId: candidate.candidateId,  // CHANGED from candidate._id to candidate.candidateId
      name: candidate.name,
      email: candidate.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;