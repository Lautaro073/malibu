import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { deleteAdminExpense } from "@/lib/admin/expenses";
import { requireAdmin } from "@/lib/auth/admin";
import type { RouteContext } from "@/types/next";

interface ExpenseParams {
  expenseId: string;
}

export async function DELETE(request: Request, context: RouteContext<ExpenseParams>) {
  try {
    await requireAdmin(request);
    const { expenseId } = await context.params;
    await deleteAdminExpense(expenseId);

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al eliminar gasto");
  }
}
