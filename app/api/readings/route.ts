import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/readings - All readings for the current user (across all sessions)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") || "10000");

  const where: Record<string, unknown> = {
    session: { userId: session.user.id },
  };

  if (from || to) {
    where.timestamp = {};
    if (from) (where.timestamp as Record<string, Date>).gte = new Date(from);
    if (to) (where.timestamp as Record<string, Date>).lte = new Date(to);
  }

  const readings = await prisma.reading.findMany({
    where,
    orderBy: { timestamp: "asc" },
    take: limit,
    select: {
      dbLevel: true,
      timestamp: true,
    },
  });

  // Aggregate stats matching the same filter
  const stats = await prisma.reading.aggregate({
    where,
    _min: { dbLevel: true },
    _max: { dbLevel: true },
    _avg: { dbLevel: true },
  });

  return NextResponse.json({
    readings,
    stats: {
      min: stats._min.dbLevel,
      max: stats._max.dbLevel,
      avg: stats._avg.dbLevel ? Math.round(stats._avg.dbLevel * 10) / 10 : null,
    },
  });
}
