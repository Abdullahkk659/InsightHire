import express from 'express';
const router = express.Router();
import Question from '../models/Question.js';

// Shuffle function to randomize array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find();
    // Randomize the questions before sending
    const shuffledQuestions = shuffleArray(questions);
    res.json(shuffledQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

router.post('/questions/seed', async (req, res) => {
  try {
    await Question.deleteMany({});

    const questions = [
      // Openness (4 questions)
      { text: "I prefer familiar methods rather than trying new ones.", trait: "Openness", reverse: true, order: 1 },
      { text: "I am interested in ideas that differ from my usual approach.", trait: "Openness", reverse: false, order: 2 },
      { text: "I enjoy exploring new and unconventional ideas.", trait: "Openness", reverse: false, order: 3 },
      { text: "I prefer sticking to traditional ways of doing things.", trait: "Openness", reverse: true, order: 4 },

      // Conscientiousness (4 questions)
      { text: "I usually create a plan before starting a task.", trait: "Conscientiousness", reverse: false, order: 5 },
      { text: "I sometimes leave tasks unfinished until later.", trait: "Conscientiousness", reverse: true, order: 6 },
      { text: "I pay attention to details in my work.", trait: "Conscientiousness", reverse: false, order: 7 },
      { text: "I often procrastinate on important tasks.", trait: "Conscientiousness", reverse: true, order: 8 },

      // Extraversion (4 questions)
      { text: "I am comfortable working quietly on my own for long periods.", trait: "Extraversion", reverse: true, order: 9 },
      { text: "I often speak up during group discussions.", trait: "Extraversion", reverse: false, order: 10 },
      { text: "I feel energized when surrounded by people.", trait: "Extraversion", reverse: false, order: 11 },
      { text: "I prefer small gatherings over large social events.", trait: "Extraversion", reverse: true, order: 12 },

      // Agreeableness (4 questions)
      { text: "I tend to question others' opinions during teamwork.", trait: "Agreeableness", reverse: true, order: 13 },
      { text: "I try to be cooperative when working with others.", trait: "Agreeableness", reverse: false, order: 14 },
      { text: "I am sympathetic to others' feelings.", trait: "Agreeableness", reverse: false, order: 15 },
      { text: "I sometimes prioritize my own needs over others in group settings.", trait: "Agreeableness", reverse: true, order: 16 },

      // Emotional Stability (4 questions)
      { text: "I feel tense when deadlines are close.", trait: "Emotional Stability", reverse: true, order: 17 },
      { text: "I remain steady in stressful situations.", trait: "Emotional Stability", reverse: false, order: 18 },
      { text: "I rarely feel anxious about future events.", trait: "Emotional Stability", reverse: false, order: 19 },
      { text: "I often worry about things that might go wrong.", trait: "Emotional Stability", reverse: true, order: 20 }
    ];

    const createdQuestions = await Question.insertMany(questions);
    res.status(201).json({
      message: 'Questions seeded successfully',
      count: createdQuestions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding questions', error: error.message });
  }
});

export default router;