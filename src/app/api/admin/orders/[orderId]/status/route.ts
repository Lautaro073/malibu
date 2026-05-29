import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/admin";
import { updateAdminOrderStatus } from "@/lib/orders/service";
import type { RouteContext } from "@/types/next";

interface OrderStatusParams {
  orderId: string;
}

export async function PATCH(request: Request, context: RouteContext<OrderStatusParams>) {
  try {
    await requireAdmin(request);
    const { orderId } = await context.params;
    const payload = (await request.json()) as { status?: unknown };
    const status = payload.status === "confirmed" ? "confirmed" : "cancelled";
    const order = await updateAdminOrderStatus(orderId, status);

    return NextResponse.json(order);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar el pedido");
  }
}
