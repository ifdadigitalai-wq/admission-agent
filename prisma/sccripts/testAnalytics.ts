import "dotenv/config";
import { prisma } from "../../lib/db/prisma";

async function main() {
  try {
    const count = await prisma.lead.count();
    console.log("Lead count:", count);
    
    const sample = await prisma.lead.findMany({ take: 1 });
    console.log("Sample lead:", JSON.stringify(sample, null, 2));
    
    const courses = await prisma.lead.groupBy({
      by: ["course"],
      _count: { course: true },
      orderBy: { _count: { course: "desc" } },
    });
    console.log("Courses:", JSON.stringify(courses));
    
    console.log("\n✅ All analytics queries work fine!");
  } catch (e: any) {
    console.error("❌ Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
