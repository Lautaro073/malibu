import { createHttpError } from "@/lib/api/errors";
import type { CheckoutSessionItem, Product, ProductVariant } from "@/types/domain";

interface ProductStockUpdate {
  stock: number;
  variants?: ProductVariant[];
}

function normalizeMeasure(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getNextStock(currentStock: number, quantity: number, label: string): number {
  if (currentStock < quantity) {
    throw createHttpError(400, `No hay stock suficiente para ${label}.`);
  }

  return currentStock - quantity;
}

export function buildStockUpdateForOrderItem(
  product: Product,
  item: CheckoutSessionItem
): ProductStockUpdate {
  if (product.variantes.length === 0) {
    return {
      stock: getNextStock(product.stock, item.cantidad, item.nombre),
    };
  }

  const selectedMeasure = normalizeMeasure(item.medida_seleccionada);

  if (!selectedMeasure) {
    throw createHttpError(400, `El producto ${item.nombre} requiere talle para confirmar stock.`);
  }

  let matchedVariant = false;
  const variants = product.variantes.map((variant) => {
    if (normalizeMeasure(variant.medida) !== selectedMeasure) {
      return variant;
    }

    matchedVariant = true;
    return {
      ...variant,
      stock: getNextStock(variant.stock, item.cantidad, `${item.nombre} talle ${variant.medida}`),
    };
  });

  if (!matchedVariant) {
    throw createHttpError(400, `El talle seleccionado no existe para ${item.nombre}.`);
  }

  return {
    stock: variants.reduce((total, variant) => total + variant.stock, 0),
    variants,
  };
}
