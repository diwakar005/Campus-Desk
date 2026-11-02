// Adds SAMPLE data so the chatbot has something to answer from.
// Run once:   npm run seed      (wipe and re-add: npm run seed -- --reset)
// Everything here is made up. Replace it from the Admin tab with your real data.
import 'dotenv/config';
import mongoose from 'mongoose';
import Knowledge from './models/Knowledge.js';

const inDays = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };

const sample = [
  { category: 'deadline', title: 'Semester fee payment last date', date: inDays(12), content: 'Tuition fees must be paid at the Accounts Office or the student portal by this date. A late fine of 2% per week applies afterwards. Instalment plans can be requested at the Accounts Office (Admin Block, Room 20).' },
  { category: 'deadline', title: 'Course registration last date', date: inDays(6), content: 'Register for next semester courses in the student portal. Late registration needs written approval from the Head of Department.' },
  { category: 'deadline', title: 'Scholarship application last date', date: inDays(25), content: 'Merit and need-based scholarship forms are submitted to the Student Affairs Office with last semester\'s marksheet and an income certificate.' },
  { category: 'exam', title: 'Mid-semester exams', date: inDays(20), content: 'Mid-semester exams run for one week from this date, 10:00 to 12:00 daily. The detailed timetable is posted on the Exam Cell notice board and the portal 7 days before. Hall tickets can be downloaded from the portal 3 days before.' },
  { category: 'exam', title: 'End-semester exams', date: inDays(75), content: 'End-semester exams start on this date and last about two weeks. Students need at least 75% attendance to be allowed to sit exams. Medical cases go to the Dean of Academics.' },
  { category: 'exam', title: 'Revaluation of answer sheets', content: 'Apply within 5 working days of the result announcement at the Exam Cell with the fee receipt. Results of revaluation come in about 3 weeks.' },
  { category: 'event', title: 'Annual Tech Fest', date: inDays(18), content: 'Three-day technical festival with hackathon, robotics contest and guest talks. Venue: Main Auditorium and Block C. Register at the Student Council desk or the portal.' },
  { category: 'event', title: 'Career Fair', date: inDays(32), content: 'Over 40 companies visit campus. Bring 5 printed copies of your CV. Held in the Sports Complex, 9:00 to 16:00. Resume review sessions run one week before at the Career Centre.' },
  { category: 'event', title: 'Blood Donation Camp', date: inDays(9), content: 'Organised by the NSS unit at the Health Centre, 10:00 to 15:00. All healthy students above 18 can donate.' },
  { category: 'faculty', title: 'Dean of Academics', content: 'Dr. Meera Nair. Office: Admin Block, Room 301. Meeting hours: Monday to Friday, 14:00 to 16:00. Email: dean.academics@riverside.example' },
  { category: 'faculty', title: 'Dean of Student Affairs', content: 'Prof. Arjun Rao. Office: Admin Block, Room 105. Handles scholarships, clubs, discipline and student grievances. Email: dean.students@riverside.example' },
  { category: 'faculty', title: 'Head of Computer Science Department', content: 'Dr. Sunita Verma. Office: Block C, Room 210. Email: hod.cs@riverside.example. Faculty room for CS lecturers is Block C, first floor.' },
  { category: 'faq', title: 'Library timings', content: 'The central library is open 8:00 to 22:00 on weekdays and 9:00 to 17:00 on Saturdays. Closed on Sundays. During exam weeks it stays open until midnight. A student can borrow 4 books for 14 days.' },
  { category: 'faq', title: 'Counselling support', content: 'Free and confidential counselling is available at the Wellbeing Centre (Block D, Room 4). Walk-ins Monday to Thursday, 13:00 to 15:00. Phone: (555) 010-0150.' },
  { category: 'faq', title: 'IT help and Wi-Fi', content: 'Reset your portal password from the portal login page. Wi-Fi network is CampusNet; log in with your student ID. IT Help Desk is at the Library ground floor, 9:00 to 17:00 on weekdays.' },
  { category: 'faq', title: 'Hostel maintenance problems', content: 'Report repairs to the hostel warden office or through the Report a problem tab. Urgent issues (no water, power cut, broken locks) can go to the 24/7 hostel security desk.' }
];

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set. Copy .env.example to .env first.');
  await mongoose.connect(process.env.MONGODB_URI);
  const reset = process.argv.includes('--reset');
  const count = await Knowledge.countDocuments();
  if (count > 0 && !reset) {
    console.log(`Knowledge already has ${count} entries. Use "npm run seed -- --reset" to wipe and re-add sample data.`);
  } else {
    if (reset) await Knowledge.deleteMany({});
    await Knowledge.insertMany(sample);
    console.log(`Added ${sample.length} sample entries.`);
  }
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err.message); process.exit(1); });
