import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { getOptionalCustomer } from "@/lib/auth/customer";
import { createWhatsappOrderFromCart } from "@/lib/orders/service";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { cart_id?: unknown; cartId?: unknown };
    const cartId =
      typeof payload.cart_id === "string"
        ? payload.cart_id
        : typeof payload.cartId === "string"
          ? payload.cartId
          : "";
    const customer = await getOptionalCustomer(request);
    const order = await createWhatsappOrderFromCart(cartId, customer?.uid || null);

    return NextResponse.json(order);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al registrar el pedido");
  }
}
