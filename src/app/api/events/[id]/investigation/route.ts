export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import { getUserRoles, hasRole } from "@/lib/permissions";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("rs_user_id");

    if (!userCookie) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }

    const userCompany = await getCurrentUserCompany(userCookie.value);

    if (!userCompany) {
      return NextResponse.json(
        { message: "Aucune entreprise active pour cet utilisateur." },
        { status: 400 }
      );
    }

    const companyId = userCompany.companyId;
    const roles = await getUserRoles(userCookie.value, companyId);

    if (!hasRole(roles, ["HSE_MANAGER", "COMPANY_ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { message: "Accès réservé au Responsable HSE ou Admin." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Événement introuvable." },
        { status: 404 }
      );
    }

    const investigation = await prisma.eventInvestigation.upsert({
      where: {
        eventId: event.id,
      },
      update: {
        summary: body.summary ? String(body.summary).trim() : null,
        rootCause: body.rootCause ? String(body.rootCause).trim() : null,
        method: body.method ? String(body.method).trim() : null,
        correctiveSummary: body.correctiveSummary
          ? String(body.correctiveSummary).trim()
          : null,
        preventiveSummary: body.preventiveSummary
          ? String(body.preventiveSummary).trim()
          : null,
      },
      create: {
        eventId: event.id,
        investigatorId: userCookie.value,
        summary: body.summary ? String(body.summary).trim() : null,
        rootCause: body.rootCause ? String(body.rootCause).trim() : null,
        method: body.method ? String(body.method).trim() : null,
        correctiveSummary: body.correctiveSummary
          ? String(body.correctiveSummary).trim()
          : null,
        preventiveSummary: body.preventiveSummary
          ? String(body.preventiveSummary).trim()
          : null,
      },
    });

    await prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        status:
          event.status === "REPORTED" ? "UNDER_INVESTIGATION" : event.status,
        initialAnalysis: body.summary
          ? String(body.summary).trim()
          : event.initialAnalysis,
        rcaSummary: body.rootCause
          ? String(body.rootCause).trim()
          : event.rcaSummary,
      },
    });

    return NextResponse.json({
      message: "Investigation enregistrée.",
      investigation,
    });
  } catch (error) {
    console.error("Erreur investigation:", error);

    return NextResponse.json(
      { message: "Erreur serveur investigation." },
      { status: 500 }
    );
  }
}