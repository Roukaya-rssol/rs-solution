import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import { getUserRoles, hasRole } from "@/lib/permissions";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("rs_user_id");

    if (!userCookie) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }

    const currentUserCompany = await getCurrentUserCompany(userCookie.value);

    if (!currentUserCompany) {
      return NextResponse.json(
        { message: "Aucune entreprise active." },
        { status: 400 }
      );
    }

    const roles = await getUserRoles(
      userCookie.value,
      currentUserCompany.companyId
    );

    if (!hasRole(roles, ["SUPER_ADMIN"])) {
      return NextResponse.json(
        { message: "Accès réservé au SuperAdmin." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const companyName = String(body.companyName || "").trim();
    const adminFirstName = String(body.adminFirstName || "").trim();
    const adminLastName = String(body.adminLastName || "").trim();
    const adminEmail = String(body.adminEmail || "").trim().toLowerCase();
    const adminPassword = String(body.adminPassword || "");

    if (
      !companyName ||
      !adminFirstName ||
      !adminLastName ||
      !adminEmail ||
      !adminPassword
    ) {
      return NextResponse.json(
        { message: "Tous les champs sont obligatoires." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            "Cet email existe déjà. Utilisez un autre email pour le gérant.",
        },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { code: "COMPANY_ADMIN" },
    });

    if (!role) {
      return NextResponse.json(
        { message: "Rôle COMPANY_ADMIN introuvable." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const slug = `${createSlug(companyName)}-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          status: "ACTIVE",
          defaultLanguage: "FR",
          timezone: "Africa/Casablanca",
        },
      });

      const user = await tx.user.create({
        data: {
          firstName: adminFirstName,
          lastName: adminLastName,
          email: adminEmail,
          passwordHash,
          locale: "FR",
          isActive: true,
        },
      });

      const userCompany = await tx.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          jobTitle: "Gérant / Admin entreprise",
          isActive: true,
        },
      });

      await tx.userCompanyRole.create({
        data: {
          userCompanyId: userCompany.id,
          roleId: role.id,
        },
      });

      return { company, user };
    });

    return NextResponse.json(
      {
        message: "Entreprise et gérant créés avec succès.",
        company: result.company,
        user: {
          id: result.user.id,
          email: result.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création entreprise admin:", error);

    return NextResponse.json(
      { message: "Erreur serveur création entreprise." },
      { status: 500 }
    );
  }
}