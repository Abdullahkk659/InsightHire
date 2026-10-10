import express from "express";
import mongoose from "mongoose";
import Candidate from "../MongoDb/Candidate.js";

const router = express.Router();

// Get all candidates (HR Dashboard)
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .select("-password")
      .sort({ registeredAt: -1 });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching candidates",
      error: error.message,
    });
  }
});

// Get single candidate by candidateId (Results page - for candidates)
router.get("/candidate/:candidateId", async (req, res) => {
  try {
    console.log('=== RESULTS PAGE DEBUG ===');
    console.log('Fetching candidate with candidateId:', req.params.candidateId);

    const candidate = await Candidate.findOne({ candidateId: req.params.candidateId })
      .select("-password");

    console.log('Found candidate:', candidate ? 'YES' : 'NO');
    console.log('========================');

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json(candidate);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: "Error fetching candidate",
      error: error.message,
    });
  }
});

// Get single candidate by _id (HR Dashboard - view details)
router.get("/candidates/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid candidate ID format" });
    }

    const candidate = await Candidate.findById(req.params.id).select("-password");

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching candidate",
      error: error.message,
    });
  }
});

// Submit test results - use candidateId (custom field) for test submission
router.post("/submit-test/:candidateId", async (req, res) => {
  try {
    console.log('=== BACKEND DEBUG ===');
    console.log('Received candidateId from URL:', req.params.candidateId);

    const { score, answers, traitScores, recommendedDepartment } = req.body;

    const candidate = await Candidate.findOne({ candidateId: req.params.candidateId });
    console.log('Database search result:', candidate ? 'FOUND' : 'NOT FOUND');

    if (candidate) {
      console.log('Candidate details:', {
        _id: candidate._id,
        candidateId: candidate.candidateId,
        name: candidate.name
      });
    }
    console.log('====================');

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.testCompleted = true;
    candidate.score = score;
    candidate.answers = answers;
    candidate.traitScores = traitScores;
    candidate.recommendedDepartment = recommendedDepartment;
    candidate.testCompletedAt = new Date();

    await candidate.save();

    res.json({
      message: "Test submitted successfully",
      score: candidate.score,
      traitScores: candidate.traitScores,
      recommendedDepartment: candidate.recommendedDepartment
    });
  } catch (error) {
    res.status(500).json({
      message: "Error submitting test",
      error: error.message,
    });
  }
});

// Delete candidate by _id (MongoDB ObjectId)
router.delete("/candidates/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid candidate ID format" });
    }

    const candidate = await Candidate.findByIdAndDelete(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json({
      message: "Candidate deleted successfully",
      candidateId: candidate._id
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting candidate",
      error: error.message,
    });
  }
});

export default router;