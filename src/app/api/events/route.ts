import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";

function generateEventNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RS-${year}-${random}`;
}

export async function POST(request: Request) {
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

    const body = await request.json();

    if (!body.title || !body.description || !body.eventDate) {
      return NextResponse.json(
        { message: "Titre, description et date sont obligatoires." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        companyId: userCompany.companyId,
        eventNumber: generateEventNumber(),
        module: String(body.module || "SAFETY"),
        eventType: String(body.eventType || "ACCIDENT"),
        title: String(body.title).trim(),
        description: String(body.description).trim(),
        eventDate: new Date(body.eventDate),
        severity: body.severity ? String(body.severity) : null,
        priority: body.priority ? String(body.priority) : null,
        workRelated: Boolean(body.workRelated),
        immediateActions: body.immediateActions
          ? String(body.immediateActions).trim()
          : null,
        reporterId: userCookie.value,
        status: "REPORTED",
      },
    });

    return NextResponse.json(
      {
        message: "Événement créé avec succès.",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création événement:", error);

    return NextResponse.json(
      { message: "Erreur serveur lors de la création." },
      { status: 500 }
    );
  }
}