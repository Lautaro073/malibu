import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CheckoutSessionItem, Product } from "@/types/domain";
import { buildStockUpdateForOrderItem } from "./stock";

function product(overrides: Partial<Product>): Product {
  return {
    id: "product-1",
    id_producto: "product-1",
    nombre: "Campera",
    descripcion: "",
    precio: 1000,
    precio_lista: 1000,
    precio_promocional: null,
    tiene_promocion: false,
    id_categoria: null,
    stock: 5,
    tag: null,
    tipo_medida: "none",
    medidas: [],
    variantes: [],
    imagen: null,
    imagenes: [],
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function item(overrides: Partial<CheckoutSessionItem>): CheckoutSessionItem {
  return {
    clave: "product-1::",
    cantidad: 2,
    id_producto: "product-1",
    imagen: null,
    medida_seleccionada: null,
    nombre: "Campera",
    precio: 1000,
    precio_lista: 1000,
    subtotal: 2000,
    subtotal_lista: 2000,
    tiene_promocion: false,
    ...overrides,
  };
}

describe("buildStockUpdateForOrderItem", () => {
  it("discounts product stock when the product has no variants", () => {
    const update = buildStockUpdateForOrderItem(
      product({ stock: 5 }),
      item({ cantidad: 2 })
    );

    assert.deepEqual(update, { stock: 3 });
  });

  it("discounts only the selected variant and recalculates total product stock", () => {
    const update = buildStockUpdateForOrderItem(
      product({
        stock: 7,
        medidas: ["L", "XL"],
        variantes: [
          { medida: "L", stock: 3, sku: "L-1" },
          { medida: "XL", stock: 4, sku: "XL-1" },
        ],
      }),
      item({ cantidad: 2, medida_seleccionada: "L" })
    );

    assert.deepEqual(update, {
      stock: 5,
      variants: [
        { medida: "L", stock: 1, sku: "L-1" },
        { medida: "XL", stock: 4, sku: "XL-1" },
      ],
    });
  });

  it("rejects confirmation when selected variant stock is insufficient", () => {
    assert.throws(
      () =>
        buildStockUpdateForOrderItem(
          product({
            variantes: [{ medida: "XL", stock: 1, sku: null }],
          }),
          item({ cantidad: 2, medida_seleccionada: "XL" })
        ),
      /No hay stock suficiente/
    );
  });
});
