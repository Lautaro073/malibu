import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AdminExpense, OrderSummary } from "@/types/domain";
import { buildAdminStatistics } from "./statistics";

function order(overrides: Partial<OrderSummary>): OrderSummary {
  return {
    id_orden: "order-1",
    customer_uid: null,
    checkout_session_id: "",
    cart_id: "cart-1",
    order_source: "whatsapp",
    status: "confirmed",
    payment_status: "unpaid",
    fulfillment_status: "unfulfilled",
    items: [
      {
        clave: "p1::L",
        cantidad: 2,
        id_producto: "p1",
        imagen: null,
        medida_seleccionada: "L",
        nombre: "Buzo",
        precio: 1000,
        precio_lista: 1000,
        subtotal: 2000,
        subtotal_lista: 2000,
        tiene_promocion: false,
      },
    ],
    pricing: {
      descuentos_total: 0,
      shipping_total: null,
      subtotal: 2000,
      subtotal_lista: 2000,
      total: 2000,
    },
    shipping: {
      destination_postal_code: null,
      fulfillment_type: "pickup",
      pickup_label: null,
      quotes: [],
      request: null,
      requires_address: false,
      selected_quote: null,
      selected_quote_id: null,
      status: "pending",
    },
    address: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function expense(overrides: Partial<AdminExpense>): AdminExpense {
  return {
    id_gasto: "expense-1",
    concepto: "Bolsas",
    monto: 500,
    categoria: "insumos",
    created_at: null,
    ...overrides,
  };
}

describe("buildAdminStatistics", () => {
  it("calculates revenue, expenses and rankings", () => {
    const summary = buildAdminStatistics(
      [
        order({}),
        order({
          id_orden: "order-2",
          status: "cancelled",
          pricing: {
            descuentos_total: 0,
            shipping_total: null,
            subtotal: 1000,
            subtotal_lista: 1000,
            total: 1000,
          },
        }),
      ],
      [expense({ monto: 500 })]
    );

    assert.equal(summary.grossRevenue, 2000);
    assert.equal(summary.expensesTotal, 500);
    assert.equal(summary.netRevenue, 1500);
    assert.equal(summary.topSoldProducts[0].label, "Buzo");
    assert.deepEqual(summary.topSoldProducts[0].measures, ["L"]);
    assert.equal(summary.topCancelledProducts[0].quantity, 2);
    assert.deepEqual(summary.lowSoldProducts, []);
  });
});
