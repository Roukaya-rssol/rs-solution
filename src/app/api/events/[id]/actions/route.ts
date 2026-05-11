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

    if (
      !hasRole(roles, [
        "MANAGER",
        "HSE_MANAGER",
        "COMPANY_ADMIN",
        "SUPER_ADMIN",
      ])
    ) {
      return NextResponse.json(
        { message: "Accès refusé pour créer une action." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json(
        { message: "Le titre de l’action est obligatoire." },
        { status: 400 }
      );
    }

    if (!body.responsibleId) {
      return NextResponse.json(
        { message: "Le responsable est obligatoire." },
        { status: 400 }
      );
    }

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

    const responsible = await prisma.userCompany.findFirst({
      where: {
        userId: String(body.responsibleId),
        companyId,
        isActive: true,
      },
    });

    if (!responsible) {
      return NextResponse.json(
        { message: "Responsable invalide pour cette entreprise." },
        { status: 400 }
      );
    }

    const action = await prisma.actionItem.create({
      data: {
        companyId,
        eventId: event.id,
        title: String(body.title).trim(),
        description: body.description ? String(body.description).trim() : null,
        actionType: body.actionType ? String(body.actionType) : "CORRECTIVE",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        responsibleId: String(body.responsibleId),
        createdById: userCookie.value,
        status: "ASSIGNED",
      },
    });

    await prisma.notification.create({
      data: {
        companyId,
        userId: String(body.responsibleId),
        type: "ACTION_ASSIGNED",
        title: "Nouvelle action assignée",
        message: `Une nouvelle action vous a été assignée : ${action.title}`,
        status: "UNREAD",
        link: `/actions/${action.id}`,
      },
    });

    await prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        status:
          event.status === "REPORTED" || event.status === "UNDER_INVESTIGATION"
            ? "ACTION_PLAN_CREATED"
            : event.status,
      },
    });

    return NextResponse.json(
      {
        message: "Action créée avec succès.",
        action,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création action:", error);

    return NextResponse.json(
      { message: "Erreur serveur lors de la création de l’action." },
      { status: 500 }
    );
  }
}