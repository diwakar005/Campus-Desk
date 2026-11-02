import mongoose from 'mongoose';

export const KNOWLEDGE_CATEGORIES = ['deadline', 'exam', 'event', 'faculty', 'faq', 'other'];

// One row = one fact the chatbot may use: a deadline, an exam date, an event, a faculty member, an FAQ...
const knowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: KNOWLEDGE_CATEGORIES, default: 'faq' },
    date: { type: Date, default: null }, // optional: deadline / exam / event date
    content: { type: String, required: true, trim: true, maxlength: 3000 }
  },
  { timestamps: true }
);

export default mongoose.model('Knowledge', knowledgeSchema);
