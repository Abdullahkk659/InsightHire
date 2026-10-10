import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  candidateId: {                    // ADD THIS FIELD
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  testCompleted: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    default: 0,                    // Changed from null to 0
  },
  answers: [
    {
      question: String,
      answer: String,
      trait: String,
      score: Number,
      reverse: Boolean
    },
  ],
  traitScores: {
    Openness: { type: Number, default: 0 },
    Conscientiousness: { type: Number, default: 0 },
    Extraversion: { type: Number, default: 0 },
    Agreeableness: { type: Number, default: 0 },
    "Emotional Stability": { type: Number, default: 0 }
  },
  recommendedDepartment: {
    type: String,
    default: "Pending"              // Changed from null
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  testCompletedAt: {
    type: Date,
    default: null,
  },
});

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;