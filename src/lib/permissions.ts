import { prisma } from "@/lib/prisma";

export async function getUserRoles(userId: string, companyId: string) {
  const userCompany = await prisma.userCompany.findFirst({
    where: {
      userId,
      companyId,
      isActive: true,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!userCompany) return [];

  return userCompany.roles.map((r) => r.role.code);
}

export function hasRole(
  roles: string[],
  allowed: string[]
): boolean {
  return roles.some((r) => allowed.includes(r));
}