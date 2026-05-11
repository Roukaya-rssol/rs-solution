export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("rs_user_id");

    if (!userCookie) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Nom entreprise obligatoire." },
        { status: 400 }
      );
    }

    const baseSlug = createSlug(name);
    const slug = `${baseSlug}-${Date.now()}`;

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        status: "ACTIVE",
        defaultLanguage: "FR",
        timezone: "Africa/Casablanca",
      },
    });

    const userCompany = await prisma.userCompany.create({
      data: {
        userId: userCookie.value,
        companyId: company.id,
        isActive: true,
      },
    });

    const role = await prisma.role.findUnique({
      where: { code: "COMPANY_ADMIN" },
    });

    if (role) {
      await prisma.userCompanyRole.create({
        data: {
          userCompanyId: userCompany.id,
          roleId: role.id,
        },
      });
    }

    const response = NextResponse.json({
      message: "Entreprise créée.",
      company,
    });

    response.cookies.set("rs_company_id", company.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Erreur création entreprise:", error);

    return NextResponse.json(
      { message: "Erreur serveur entreprise." },
      { status: 500 }
    );
  }
}