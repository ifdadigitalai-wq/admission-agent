import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/db/prisma";

async function main() {
  const admins = [
    { name: "Super Admin", email: "admin@ifdadigitalai.com", password: "Admin@123" },
    { name: "Manager",     email: "manager@ifdadigitalai.com", password: "Manager@123" },
  ];

  for (const admin of admins) {
    const hashed = await bcrypt.hash(admin.password, 12);
    await prisma.admin.upsert({
      where: { email: admin.email },
      update: {},
      create: { name: admin.name, email: admin.email, password: hashed },
    });
    console.log(`✅ Admin created: ${admin.email}`);
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });