import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed SuperAdmin...");

  // 🔥 créer rôles
  const roles = [
    { code: "SUPER_ADMIN", name: "Super Admin" },
    { code: "COMPANY_ADMIN", name: "Admin Entreprise" },
    { code: "HSE_MANAGER", name: "Responsable HSE" },
    { code: "MANAGER", name: "Manager" },
    { code: "EMPLOYEE", name: "Employé" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  // 🔐 mot de passe
  const passwordHash = await bcrypt.hash("Admin123456!", 10);

  // 👤 créer SuperAdmin
  const superAdmin = await prisma.user.create({
    data: {
      firstName: "Super",
      lastName: "Admin",
      email: "admin@rs.com",
      passwordHash,
      locale: "FR",
      isActive: true,
    },
  });

  // 🏢 entreprise système (optionnelle mais utile)
  const company = await prisma.company.create({
    data: {
      name: "RS System",
      slug: "rs-system",
      status: "ACTIVE",
      defaultLanguage: "FR",
      timezone: "Africa/Casablanca",
    },
  });

  // 🔗 lien user ↔ company
  const userCompany = await prisma.userCompany.create({
    data: {
      userId: superAdmin.id,
      companyId: company.id,
      isActive: true,
    },
  });

  // 🔑 assign role SUPER_ADMIN
  const roleSuperAdmin = await prisma.role.findUnique({
    where: { code: "SUPER_ADMIN" },
  });

  if (roleSuperAdmin) {
    await prisma.userCompanyRole.create({
      data: {
        userCompanyId: userCompany.id,
        roleId: roleSuperAdmin.id,
      },
    });
  }

  console.log("✅ SuperAdmin créé");
  console.log("📧 Email: admin@rs.com");
  console.log("🔑 Password: Admin123456!");
}

main()
  .then(() => {
    console.log("🌱 Seed terminé");
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });