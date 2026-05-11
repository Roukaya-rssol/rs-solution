import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Déconnexion réussie.",
  });

  response.cookies.set("rs_user_id", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}