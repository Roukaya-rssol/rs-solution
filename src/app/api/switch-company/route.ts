export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId } = body;

    const cookieStore = await cookies();

    cookieStore.set("rs_company_id", companyId);

    return NextResponse.json({ message: "Entreprise changée" });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur switch entreprise" },
      { status: 500 }
    );
  }
}