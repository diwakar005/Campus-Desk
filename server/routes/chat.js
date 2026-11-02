import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import Knowledge from '../models/Knowledge.js';
import ChatLog from '../models/ChatLog.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const LABELS = {
  deadline: 'Deadline',
  exam: 'Exam',
  event: 'Event',
  faculty: 'Faculty / staff',
  faq: 'FAQ',
  other: 'Other'
};

// Everything in the Knowledge collection is placed into the model's instructions on each request.
// This is simple and works well for a few hundred entries. For thousands, add search/retrieval first.
async function buildSystemPrompt() {
  const entries = await Knowledge.find().sort({ category: 1, date: 1 }).limit(300).lean();
  const today = new Date().toISOString().slice(0, 10);

  const data = entries.length
    ? entries
        .map((e) => {
          const when = e.date ? ` (date: ${e.date.toISOString().slice(0, 10)})` : '';
          return `[${LABELS[e.category] || 'Other'}] ${e.title}${when}\n${e.content}`;
        })
        .join('\n\n')
    : '(no campus data has been added yet)';

  return [
    `You are Campus Desk, the student support assistant for ${process.env.UNIVERSITY_NAME || 'the university'}. Today's date is ${today}.`,
    'You help students with deadlines, exam schedules, events, faculty and staff contacts, and general campus questions.',
    '',
    'Rules:',
    '- For anything specific to this university (dates, names, places, fees, rules), use ONLY the CAMPUS DATA below. Never invent dates, names, rooms, phone numbers or emails.',
    '- If the data does not contain the answer, say so plainly and suggest the student use the "Report a problem" tab so staff can follow up.',
    '- Use today\'s date to judge what is upcoming and what has passed. When giving a date, write it clearly (for example 14 March 2026).',
    '- Be friendly, short and direct. Give the answer first, then any next step. Use a short list when there are several items.',
    '- Reply in the language the student writes in.',
    '- You cannot look up personal student records or take actions in university systems.',
    '- If a student mentions self-harm, suicide, abuse or immediate danger, respond with care, encourage them to contact campus security or local emergency services now, and share any counselling contacts found in the data.',
    '',
    'CAMPUS DATA:',
    data
  ].join('\n');
}

router.post('/', asyncHandler(async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Please type a message.' });
  if (message.length > 1000) return res.status(400).json({ error: 'Message is too long (max 1000 characters).' });

  const ai = getClient();
  if (!ai) return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server.' });

  // The browser sends recent turns; Gemini calls the assistant role "model".
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-10) : [];
  const contents = history
    .filter((h) => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'assistant'))
    .map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text.slice(0, 2000) }] }));
  while (contents.length && contents[0].role !== 'user') contents.shift();
  contents.push({ role: 'user', parts: [{ text: message }] });

  const systemInstruction = await buildSystemPrompt();

  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents,
      config: { systemInstruction, temperature: 0.3 }
    });
    const reply = result.text || 'Sorry, I could not come up with an answer. Please try rephrasing your question.';

    ChatLog.create({ sessionId: String(req.body.sessionId || '').slice(0, 64), question: message, answer: reply }).catch(() => {});
    res.json({ reply });
  } catch (err) {
    console.error('Gemini error:', err.status || '', err.message);
    if (err.status === 429) return res.status(429).json({ error: 'The AI service is busy or its quota is used up. Try again in a minute.' });
    if (err.status === 400 || err.status === 403) return res.status(502).json({ error: 'The Gemini API rejected the request. Check GEMINI_API_KEY and GEMINI_MODEL on the server.' });
    res.status(502).json({ error: 'The AI service could not answer right now. Please try again.' });
  }
}));

export default router;
