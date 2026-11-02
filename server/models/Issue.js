import mongoose from 'mongoose';

export const ISSUE_CATEGORIES = ['academic', 'fees', 'hostel', 'it', 'facilities', 'other'];
export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved'];

const issueSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200, match: /^\S+@\S+\.\S+$/ },
    category: { type: String, enum: ISSUE_CATEGORIES, default: 'other' },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ISSUE_STATUSES, default: 'open' }
  },
  { timestamps: true }
);

export default mongoose.model('Issue', issueSchema);
