import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CheckoutSessionItem } from "@/types/domain";
import {
  buildWhatsappOrderFingerprint,
  shouldReuseWhatsappOrder,
} from "./idempotency";

function item(overrides: Partial<CheckoutSessionItem>): CheckoutSessionItem {
  return {
    clave: "product-1::XL",
    cantidad: 1,
    id_producto: "product-1",
    imagen: null,
    medida_seleccionada: "XL",
    nombre: "Buzo",
    precio: 30000,
    precio_lista: 30000,
    subtotal: 30000,
    subtotal_lista: 30000,
    tiene_promocion: false,
    ...overrides,
  };
}

describe("WhatsApp order idempotency", () => {
  it("reuses only pending orders with the same cart content", () => {
    const fingerprint = buildWhatsappOrderFingerprint([item({ cantidad: 1 })]);

    assert.equal(
      shouldReuseWhatsappOrder({
        existingFingerprint: fingerprint,
        nextFingerprint: fingerprint,
        status: "pending_confirmation",
      }),
      true
    );

    assert.equal(
      shouldReuseWhatsappOrder({
        existingFingerprint: fingerprint,
        nextFingerprint: buildWhatsappOrderFingerprint([item({ cantidad: 2 })]),
        status: "pending_confirmation",
      }),
      false
    );

    assert.equal(
      shouldReuseWhatsappOrder({
        existingFingerprint: fingerprint,
        nextFingerprint: fingerprint,
        status: "confirmed",
      }),
      false
    );
  });
});
