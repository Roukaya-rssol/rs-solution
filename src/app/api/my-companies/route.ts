export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("rs_user_id");

    if (!userCookie) {
      return NextResponse.json({ companies: [] });
    }

    const companies = await prisma.userCompany.findMany({
      where: {
        userId: userCookie.value,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    return NextResponse.json({ companies: [] });
  }
}