import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  testCompleted: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  answers: [{
    question: String,
    answer: String,
    trait: String,
    score: Number,
    reverse: Boolean
  }],
  traitScores: {
    Openness: { type: Number, default: 0 },
    Conscientiousness: { type: Number, default: 0 },
    Extraversion: { type: Number, default: 0 },
    Agreeableness: { type: Number, default: 0 },
    "Emotional Stability": { type: Number, default: 0 }
  },
  recommendedDepartment: {
    type: String,
    default: "Pending"
  },
  testCompletedAt: {
    type: Date
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Candidate', candidateSchema);