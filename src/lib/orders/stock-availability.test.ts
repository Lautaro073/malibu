import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OrderSummary, Product } from "@/types/domain";
import { getOrderStockWarnings } from "./stock-availability";

function product(overrides: Partial<Product>): Product {
  return {
    id: "product-1",
    id_producto: "product-1",
    nombre: "Buzo",
    descripcion: "",
    precio: 1000,
    precio_lista: 1000,
    precio_promocional: null,
    tiene_promocion: false,
    id_categoria: null,
    stock: 3,
    tag: null,
    tipo_medida: "none",
    medidas: [],
    variantes: [],
    imagen: null,
    imagenes: [],
    created_at: null,
    updated_at: null,
    deleted_at: null,
    is_deleted: false,
    ...overrides,
  };
}

function order(overrides: Partial<OrderSummary>): OrderSummary {
  return {
    id_orden: "order-1",
    customer_uid: null,
    checkout_session_id: "",
    cart_id: "cart-1",
    order_source: "whatsapp",
    status: "pending_confirmation",
    payment_status: "unpaid",
    fulfillment_status: "unfulfilled",
    items: [
      {
        clave: "product-1::XL",
        cantidad: 2,
        id_producto: "product-1",
        imagen: null,
        medida_seleccionada: "XL",
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

describe("getOrderStockWarnings", () => {
  it("warns when a selected variant does not have enough stock", () => {
    const warnings = getOrderStockWarnings(
      order({}),
      [
        product({
          stock: 1,
          tipo_medida: "ropa",
          medidas: ["XL"],
          variantes: [{ medida: "XL", stock: 1, sku: null }],
        }),
      ]
    );

    assert.equal(warnings.length, 1);
    assert.match(warnings[0].message, /pide 2, hay 1 disponible/);
  });

  it("does not warn when a confirmed order is already closed", () => {
    const warnings = getOrderStockWarnings(
      order({ status: "confirmed" }),
      [product({ stock: 0 })]
    );

    assert.deepEqual(warnings, []);
  });
});
