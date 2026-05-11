import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import { getUserRoles, hasRole } from "@/lib/permissions";

export async function POST(request: Request) {
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

    const companyId = currentUserCompany.companyId;

    const roles = await getUserRoles(userCookie.value, companyId);

    if (!hasRole(roles, ["COMPANY_ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json(
        {
          message:
            "Accès refusé. Seul un administrateur peut créer un utilisateur.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.password) {
      return NextResponse.json(
        { message: "Tous les champs obligatoires doivent être remplis." },
        { status: 400 }
      );
    }

    const email = String(body.email).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Un utilisateur avec cet email existe déjà." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(String(body.password), 10);

    const role = await prisma.role.findUnique({
      where: {
        code: String(body.roleCode || "EMPLOYEE"),
      },
    });

    if (!role) {
      return NextResponse.json(
        { message: "Rôle introuvable." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        firstName: String(body.firstName).trim(),
        lastName: String(body.lastName).trim(),
        email,
        passwordHash,
        locale: "FR",
        isActive: true,
      },
    });

    const userCompany = await prisma.userCompany.create({
      data: {
        userId: user.id,
        companyId,
        jobTitle: body.jobTitle ? String(body.jobTitle).trim() : null,
        isActive: true,
      },
    });

    await prisma.userCompanyRole.create({
      data: {
        userCompanyId: userCompany.id,
        roleId: role.id,
      },
    });

    return NextResponse.json(
      {
        message: "Utilisateur créé avec succès.",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création utilisateur:", error);

    return NextResponse.json(
      { message: "Erreur serveur création utilisateur." },
      { status: 500 }
    );
  }
}