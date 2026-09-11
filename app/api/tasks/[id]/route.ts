import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/tasks/:id — flip a task between done and not done
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: { done: Boolean(body.done) },
  });

  return NextResponse.json(task);
}

// DELETE /api/tasks/:id — remove a task
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await prisma.task.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
