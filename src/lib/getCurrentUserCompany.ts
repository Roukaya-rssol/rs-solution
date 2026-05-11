import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserCompany(userId: string) {
  const cookieStore = await cookies();
  const companyCookie = cookieStore.get("rs_company_id");

  if (companyCookie?.value) {
    const userCompany = await prisma.userCompany.findFirst({
      where: {
        userId,
        companyId: companyCookie.value,
        isActive: true,
      },
      include: {
        company: true,
        user: true,
      },
    });

    if (userCompany) {
      return userCompany;
    }
  }

  const fallback = await prisma.userCompany.findFirst({
    where: {
      userId,
      isActive: true,
    },
    include: {
      company: true,
      user: true,
    },
  });

  return fallback;
}