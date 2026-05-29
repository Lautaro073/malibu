import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { createAdminExpense, listAdminExpenses } from "@/lib/admin/expenses";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const expenses = await listAdminExpenses();

    return NextResponse.json({ expenses });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al cargar gastos");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const payload = await request.json();
    const expense = await createAdminExpense(payload);

    return NextResponse.json(expense, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear gasto");
  }
}
