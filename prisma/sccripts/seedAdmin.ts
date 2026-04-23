import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/db/prisma";

async function main() {
  const admins = [
    { name: "Super Admin",  email: "admin@ifdadigitalai.com",      password: "Admin@123",      role: "ADMIN" as const },
    { name: "Counselor",    email: "counselor@ifdadigitalai.com",   password: "Counselor@123",  role: "COUNSELOR" as const },
    { name: "Telecaller",   email: "telecaller@ifdadigitalai.com",  password: "Telecaller@123", role: "TELECALLER" as const },
    { name: "Manager",      email: "manager@ifdadigitalai.com",     password: "Manager@123",    role: "MANAGER" as const },
    { name: "Support",      email: "support@ifdadigitalai.com",     password: "Support@123",    role: "SUPPORT" as const },
  ];

  for (const admin of admins) {
    const hashed = await bcrypt.hash(admin.password, 12);
    await prisma.admin.upsert({
      where: { email: admin.email },
      update: { role: admin.role },
      create: { name: admin.name, email: admin.email, password: hashed, role: admin.role },
    });
    console.log(`✅ Admin created/updated: ${admin.email} (${admin.role})`);
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });