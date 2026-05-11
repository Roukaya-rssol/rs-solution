import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function getFileType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";

  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("text")
  ) {
    return "DOCUMENT";
  }

  return "OTHER";
}

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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { message: "Fichier invalide." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const attachment = await prisma.eventAttachment.create({
      data: {
        eventId: event.id,
        fileName: file.name,
        fileUrl: `/uploads/${fileName}`,
        fileType: getFileType(file.type),
        mimeType: file.type,
        fileSize: file.size,
        uploadedById: userCookie.value,
      },
    });

    return NextResponse.json(
      {
        message: "Fichier ajouté avec succès.",
        attachment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur upload fichier:", error);

    return NextResponse.json(
      { message: "Erreur serveur upload." },
      { status: 500 }
    );
  }
}