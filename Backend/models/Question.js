import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  trait: {
    type: String,
    required: true,
    enum: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Emotional Stability']
  },
  reverse: {
    type: Boolean,
    required: true
  },
  order: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Question', questionSchema);