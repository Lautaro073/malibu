import type { OrderSummary, Product } from "@/types/domain";

export interface OrderStockWarning {
  itemKey: string;
  message: string;
}

function formatStock(value: number): string {
  return value === 1 ? "1 disponible" : `${value} disponibles`;
}

export function getOrderStockWarnings(
  order: OrderSummary,
  products: Product[]
): OrderStockWarning[] {
  if (order.status !== "pending_confirmation") {
    return [];
  }

  return order.items.flatMap((item) => {
    const product = products.find((current) => current.id_producto === item.id_producto);

    if (!product) {
      return [
        {
          itemKey: item.clave,
          message: `${item.nombre}: la prenda ya no existe en el catalogo.`,
        },
      ];
    }

    if (item.medida_seleccionada) {
      const variant = product.variantes.find(
        (current) =>
          current.medida.toLowerCase() === item.medida_seleccionada?.toLowerCase()
      );

      if (!variant) {
        return [
          {
            itemKey: item.clave,
            message: `${item.nombre} talle ${item.medida_seleccionada}: ese talle ya no existe.`,
          },
        ];
      }

      if (variant.stock < item.cantidad) {
        return [
          {
            itemKey: item.clave,
            message: `${item.nombre} talle ${item.medida_seleccionada}: pide ${item.cantidad}, hay ${formatStock(variant.stock)}.`,
          },
        ];
      }

      return [];
    }

    if (product.stock < item.cantidad) {
      return [
        {
          itemKey: item.clave,
          message: `${item.nombre}: pide ${item.cantidad}, hay ${formatStock(product.stock)}.`,
        },
      ];
    }

    return [];
  });
}
