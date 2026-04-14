import "dotenv/config";
import { prisma } from "../../lib/db/prisma";

async function main() {
  await prisma.faq.deleteMany();
  await prisma.faq.createMany({
    data: [
  // Short Term Courses
  { question: "What is the fee for the Basic Computer Courses?", answer: "The fee for the Basic Computer Courses is ₹8000." },
  { question: "What is the fee for the Advance Excel course?", answer: "The fee for the Advance Excel course is ₹6000." },
  { question: "What is the fee for the Spoken English course?", answer: "The fee for the Spoken English course is ₹8000." },
  { question: "What is the fee for the Certificate Course in Office Automation (CCOA)?", answer: "The fee is ₹12000." },

      // Diploma
      { question: "What is the fee for the Diploma in Computer Applications (DCA)?", answer: "The fee is ₹20000." },
      { question: "What is the fee for the Master Diploma in Computer Applications (MDCA)?", answer: "The fee is ₹25000." },

      // Programming
      { question: "What is the fee for the Diploma in Programming?", answer: "The fee is ₹70000." },
      { question: "What is the fee for the Python Core course?", answer: "The fee is ₹12000." },
      { question: "What is the fee for the Python Advance course?", answer: "The fee is ₹15000." },
      { question: "What is the fee for the Python with Machine Learning course?", answer: "The fee is ₹35000." },
      { question: "What is the fee for the Python with Data Science course?", answer: "The fee is ₹50000." },

      // Web Dev
      { question: "What is the fee for the Website Designing course?", answer: "The fee is ₹25000." },
      { question: "What is the fee for the Website Development course?", answer: "The fee is ₹25000." },
      { question: "What is the fee for the IT-Genius course?", answer: "The fee is ₹45000." },
      { question: "What is the fee for the Full Stack Development course?", answer: "The fee is ₹45000." },
      { question: "What is the fee for the Mern Stack Development course?", answer: "The fee is ₹45000." },
      { question: "What is the fee for the UI UX course?", answer: "The fee is ₹45000." },

      // Multimedia
      { question: "What is the fee for the Graphic Designing course?", answer: "The fee is ₹25000." },
      { question: "What is the fee for the Graphic Designing Pro course?", answer: "The fee is ₹35000." },
      { question: "What is the fee for the Video Editing course?", answer: "The fee is ₹25000." },

      // Digital Marketing
      { question: "What is the fee for the Certification in Digital Marketing?", answer: "The fee is ₹35000." },
      { question: "What is the fee for the Master in Digital Marketing (MDM)?", answer: "The fee is ₹45000." },
      { question: "What is the fee for the Diploma in Digital Marketing and Web Development?", answer: "The fee is ₹65000." },

      // Accounting
      { question: "What is the fee for TallyEssential Level 1 (Recording & Reporting)?", answer: "The fee is ₹6000." },
      { question: "What is the fee for TallyEssential Level 2 (Accounts Payable And Receivable)?", answer: "The fee is ₹6000." },
      { question: "What is the fee for TallyEssential Level 3 (Taxation And Compliance)?", answer: "The fee is ₹6000." },
      { question: "What is the fee for Tally E-Accounting?", answer: "The fee is ₹20000." },
      { question: "What is the fee for Certification in Professional Accounting (CPA)?", answer: "The fee is ₹25000." },
      { question: "What is the fee for Corporate E-Accounting?", answer: "The fee is ₹45000." },
      { question: "What is the fee for Certification in Financial Accounting (CFA)?", answer: "The fee is ₹22000." },
      { question: "What is the fee for Payroll?", answer: "The fee is ₹6000." },
      { question: "What is the fee for GST course?", answer: "The fee is ₹6000." },
      { question: "What is the fee for TDS course?", answer: "The fee is ₹6000." },
      { question: "What is the fee for Income Tax course?", answer: "The fee is ₹6000." },

      // Data Analytics
      { question: "What is the fee for Certification in Data Analytics?", answer: "The fee is ₹45000." },
      { question: "What is the fee for Master in Data Analytics?", answer: "The fee is ₹65000." },

      // Stock Market
      { question: "What is the fee for Stock Market Course For Beginners?", answer: "The fee is ₹10000." },
      { question: "What is the fee for Advance Options Strategies Course?", answer: "The fee is ₹15000." },
      { question: "What is the fee for Advance Technical Analysis Course?", answer: "The fee is ₹18000." },
      { question: "What is the fee for NISM Equity Derivative Series VIII?", answer: "The fee is ₹15000." },
      { question: "What is the fee for Professional Stock Market Trading Course?", answer: "The fee is ₹35000." },
      { question: "What is the fee for Diploma in Financial Market?", answer: "The fee is ₹65000." },
      { question: "What is the fee for Advance Diploma in Financial Market?", answer: "The fee is ₹100000." },
      { question: "What is the fee for NCFM Capital Market Course?", answer: "The fee is ₹10000." },
      { question: "What is the fee for NCFM Fundamental Analysis Course?", answer: "The fee is ₹10000." },
      { question: "What is the fee for NISM Commodity Market Course?", answer: "The fee is ₹8000." },
      { question: "What is the fee for NISM Currency Market Course?", answer: "The fee is ₹8000." },

      // Other Courses
      { question: "What is the fee for Corel Draw course?", answer: "The fee is ₹6000." },
      { question: "What is the fee for Photoshop course?", answer: "The fee is ₹6000." },
      { question: "What is the fee for Indesign course?", answer: "The fee is ₹6000." },
      { question: "What is the fee for Illustrator course?", answer: "The fee is ₹6000." },
      { question: "What is the fee for Java Script course?", answer: "The fee is ₹6000." },
      { question: "What is the fee for PHP Core course?", answer: "The fee is ₹10000 or ₹15000 depending on the batch." },
      { question: "What is the fee for MySQL course?", answer: "The fee is ₹12000." },
      { question: "What is the fee for Wordpress course?", answer: "The fee is ₹8000." },
      { question: "What is the fee for C & C++ Combo course?", answer: "The fee is ₹15000." },
      { question: "What is the fee for C course?", answer: "The fee is ₹10000." },
      { question: "What is the fee for C++ course?", answer: "The fee is ₹10000." },
      { question: "What is the fee for Core Java course?", answer: "The fee is ₹12000." },
      { question: "What is the fee for Advance Java course?", answer: "The fee is ₹15000." },
      { question: "What is the fee for VBA course?", answer: "The fee is ₹6000 (typo corrected from ₹12000 — please verify)." },
      { question: "What is the fee for React course?", answer: "The fee is ₹12000." },
      { question: "What is the fee for Angular course?", answer: "The fee is ₹12000." },
      { question: "What is the fee for Mongo DB course?", answer: "The fee is ₹12000." },

      // General
      { question: "What documents are required for admission?", answer: "You need your marksheet, ID proof, and photographs." },
      { question: "Is EMI available?", answer: "Yes, EMI options are available. Please contact the admissions team for details." },
      { question: "How to enroll?", answer: "You can enroll by visiting the institute or contacting our admissions team directly." },
      { question: "What is IFDA Institute?", answer: "IFDA Institute is an ISO 9001:2015 certified, NSDC aligned institute offering 125+ AI-integrated programs in IT, Accounts, Data, Design, Marketing, and Business." },
      { question: "Is the training practical?", answer: "Yes, 100% of our training is practical and hands-on with real-world projects." },
      { question: "What certifications do you offer?", answer: "We offer industry-recognized certifications aligned with NSDC and ISO 9001:2015 standards." },
    ],
  });

  console.log("✅ FAQs seeded successfully!");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });