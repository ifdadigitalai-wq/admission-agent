// prisma/sccripts/seed.ts
import "dotenv/config";
import { prisma } from "../../lib/db/prisma";

async function main() {
  await prisma.faq.createMany({
    data: [
      // Data Science
      {
        question: "What is the duration of the Data Science course?",
        answer: "The Data Science course is 6 months long, covering Python, Machine Learning, and Data Visualization.",
      },
      {
        question: "What are the eligibility criteria for the Data Science program?",
        answer: "Candidates must have a basic understanding of mathematics and statistics. A graduation degree is preferred.",
      },
      {
        question: "What is the fee for the Data Science course?",
        answer: "The Data Science course fee is ₹45,000 and includes all study materials and project guidance.",
      },

      // Finance
      {
        question: "What topics are covered in the Finance course?",
        answer: "The Finance course covers Financial Modeling, Investment Analysis, Stock Markets, and Corporate Finance.",
      },
      {
        question: "Is the Finance course available online?",
        answer: "Yes, the Finance course is available both online and offline. Online classes are held on weekends.",
      },
      {
        question: "What is the fee for the Finance program?",
        answer: "The Finance program fee is ₹35,000 which includes certifications and live project experience.",
      },

      // Programming
      {
        question: "What programming languages are taught in the Programming course?",
        answer: "We teach Python, JavaScript, Java, and C++. Students can choose a specialization track after the first month.",
      },
      {
        question: "Is prior coding experience required for the Programming course?",
        answer: "No prior experience is needed. We have beginner, intermediate, and advanced batches available.",
      },
      {
        question: "What is the duration and fee of the Programming course?",
        answer: "The Programming course is 4 months long with a fee of ₹25,000, including hands-on project work.",
      },

      // General Admission
      {
        question: "What documents are required for admission?",
        answer: "You need your last qualification marksheet, a government ID proof, and 2 passport-sized photographs.",
      },
      {
        question: "What is the last date to apply?",
        answer: "Admissions are open on a rolling basis. However, batch seats are limited so early registration is advised.",
      },
      {
        question: "Is there an EMI option available for course fees?",
        answer: "Yes, we offer 3, 6, and 12 month EMI options with 0% interest through our banking partners.",
      },
    ],
  });

  console.log("✅ FAQs seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });