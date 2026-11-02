import mongoose from 'mongoose';

// Optional log of questions and answers, useful to see what students ask and what data is missing.
const chatLogSchema = new mongoose.Schema(
  {
    sessionId: { type: String, default: '' },
    question: { type: String, required: true },
    answer: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('ChatLog', chatLogSchema);
