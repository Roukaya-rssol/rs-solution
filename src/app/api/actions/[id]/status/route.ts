export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

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

    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "");

    const allowedStatuses = [
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "DONE",
      "VALIDATED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Statut invalide." },
        { status: 400 }
      );
    }

    const action = await prisma.actionItem.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!action) {
      return NextResponse.json(
        { message: "Action introuvable." },
        { status: 404 }
      );
    }

    const isResponsible = action.responsibleId === userCookie.value;
    const canValidate = hasRole(roles, [
      "MANAGER",
      "HSE_MANAGER",
      "COMPANY_ADMIN",
      "SUPER_ADMIN",
    ]);

    if (status === "IN_PROGRESS" || status === "DONE") {
      if (!isResponsible && !canValidate) {
        return NextResponse.json(
          { message: "Seul le responsable ou un manager peut modifier cette action." },
          { status: 403 }
        );
      }
    }

    if (status === "VALIDATED" || status === "CANCELLED") {
      if (!canValidate) {
        return NextResponse.json(
          { message: "Accès refusé pour valider ou annuler cette action." },
          { status: 403 }
        );
      }
    }

    const updatedAction = await prisma.actionItem.update({
      where: {
        id: action.id,
      },
      data: {
        status,
        completedAt: status === "DONE" ? new Date() : action.completedAt,
        validatedAt: status === "VALIDATED" ? new Date() : action.validatedAt,
        validatedById:
          status === "VALIDATED" ? userCookie.value : action.validatedById,
      },
    });

    return NextResponse.json({
      message: "Statut de l’action mis à jour.",
      action: updatedAction,
    });
  } catch (error) {
    console.error("Erreur update statut action:", error);

    return NextResponse.json(
      { message: "Erreur serveur statut action." },
      { status: 500 }
    );
  }
}