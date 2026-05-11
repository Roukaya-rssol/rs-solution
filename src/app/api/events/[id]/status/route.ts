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

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("rs_user_id");

    if (!userCookie) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }

    const userCompany = await getCurrentUserCompany(userCookie.value);

    if (!userCompany) {
      return NextResponse.json(
        { message: "Aucune entreprise active." },
        { status: 400 }
      );
    }

    const companyId = userCompany.companyId;
    const roles = await getUserRoles(userCookie.value, companyId);

    if (!hasRole(roles, ["HSE_MANAGER", "COMPANY_ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { message: "Accès refusé." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const allowedStatuses = [
      "REPORTED",
      "UNDER_INVESTIGATION",
      "ACTION_PLAN_CREATED",
      "IN_PROGRESS",
      "CLOSED",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Statut invalide." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        actions: true,
        investigation: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Événement introuvable." },
        { status: 404 }
      );
    }

    // 🔥 règles métier

    if (status === "ACTION_PLAN_CREATED") {
      if (!event.investigation) {
        return NextResponse.json(
          {
            message:
              "Impossible de créer un plan d’action sans investigation.",
          },
          { status: 400 }
        );
      }
    }

    if (status === "IN_PROGRESS") {
      if (event.actions.length === 0) {
        return NextResponse.json(
          {
            message:
              "Impossible de passer en cours sans actions définies.",
          },
          { status: 400 }
        );
      }
    }

    if (status === "CLOSED") {
      if (event.actions.length === 0) {
        return NextResponse.json(
          {
            message:
              "Impossible de clôturer sans actions correctives.",
          },
          { status: 400 }
        );
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        status,
        closedAt: status === "CLOSED" ? new Date() : null,
      },
    });

    return NextResponse.json({
      message: "Statut mis à jour.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erreur statut event:", error);

    return NextResponse.json(
      { message: "Erreur serveur." },
      { status: 500 }
    );
  }
}