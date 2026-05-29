import type { CheckoutSessionItem, OrderSummary } from "@/types/domain";

interface ReuseCheck {
  existingFingerprint: string | null;
  nextFingerprint: string;
  status: OrderSummary["status"];
}

export function buildWhatsappOrderFingerprint(items: CheckoutSessionItem[]): string {
  const normalizedItems = items
    .map((item) => ({
      productId: item.id_producto,
      measure: item.medida_seleccionada || "",
      quantity: item.cantidad,
      price: item.precio,
    }))
    .sort((left, right) => {
      const leftKey = `${left.productId}:${left.measure}`;
      const rightKey = `${right.productId}:${right.measure}`;
      return leftKey.localeCompare(rightKey);
    });

  return JSON.stringify(normalizedItems);
}

export function shouldReuseWhatsappOrder({
  existingFingerprint,
  nextFingerprint,
  status,
}: ReuseCheck): boolean {
  return status === "pending_confirmation" && existingFingerprint === nextFingerprint;
}
