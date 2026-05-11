import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";

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
    const { id } = await params;
    const body = await request.json();

    if (!body.content || !String(body.content).trim()) {
      return NextResponse.json(
        { message: "Le commentaire est obligatoire." },
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

    const comment = await prisma.eventComment.create({
      data: {
        eventId: event.id,
        authorId: userCookie.value,
        content: String(body.content).trim(),
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json(
      {
        message: "Commentaire ajouté.",
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur ajout commentaire:", error);

    return NextResponse.json(
      { message: "Erreur serveur commentaire." },
      { status: 500 }
    );
  }
}