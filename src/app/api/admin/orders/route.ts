import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminOrders } from "@/lib/orders/service";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const orders = await listAdminOrders();

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al cargar los pedidos");
  }
}
