import type { AdminExpense, OrderSummary } from "@/types/domain";

interface RankedMetric {
  id: string;
  image: string | null;
  label: string;
  measures: string[];
  quantity: number;
  total: number;
}

export interface AdminStatisticsSummary {
  cancelledPotential: number;
  cancelledTotal: number;
  confirmedOrders: number;
  expensesTotal: number;
  grossRevenue: number;
  netRevenue: number;
  topCancelledProducts: RankedMetric[];
  topMeasures: RankedMetric[];
  topSoldProducts: RankedMetric[];
  lowSoldProducts: RankedMetric[];
}

function addMetric(
  metrics: Map<string, RankedMetric>,
  id: string,
  image: string | null,
  label: string,
  quantity: number,
  total: number
): void {
  const current = metrics.get(id);

  if (!current) {
    metrics.set(id, { id, image, label, measures: [], quantity, total });
    return;
  }

  metrics.set(id, {
    ...current,
    image: current.image || image,
    quantity: current.quantity + quantity,
    total: current.total + total,
  });
}

function addMeasure(metrics: Map<string, RankedMetric>, productId: string, measure: string | null): void {
  if (!measure) {
    return;
  }

  const current = metrics.get(productId);

  if (!current || current.measures.includes(measure)) {
    return;
  }

  metrics.set(productId, {
    ...current,
    measures: [...current.measures, measure],
  });
}

function sortTop(metrics: Map<string, RankedMetric>): RankedMetric[] {
  return [...metrics.values()].sort((left, right) => {
    const byQuantity = right.quantity - left.quantity;
    return byQuantity !== 0 ? byQuantity : right.total - left.total;
  });
}

export function buildAdminStatistics(
  orders: OrderSummary[],
  expenses: AdminExpense[]
): AdminStatisticsSummary {
  const confirmedOrders = orders.filter((order) => order.status === "confirmed");
  const cancelledOrders = orders.filter((order) => order.status === "cancelled");
  const soldProducts = new Map<string, RankedMetric>();
  const cancelledProducts = new Map<string, RankedMetric>();
  const measures = new Map<string, RankedMetric>();
  const grossRevenue = confirmedOrders.reduce(
    (total, order) => total + (order.pricing.total ?? order.pricing.subtotal),
    0
  );
  const cancelledPotential = cancelledOrders.reduce(
    (total, order) => total + (order.pricing.total ?? order.pricing.subtotal),
    0
  );
  const expensesTotal = expenses.reduce((total, expense) => total + expense.monto, 0);

  for (const order of confirmedOrders) {
    for (const item of order.items) {
      addMetric(soldProducts, item.id_producto, item.imagen, item.nombre, item.cantidad, item.subtotal);
      addMeasure(soldProducts, item.id_producto, item.medida_seleccionada);

      if (item.medida_seleccionada) {
        addMetric(
          measures,
          item.medida_seleccionada.toLowerCase(),
          null,
          item.medida_seleccionada,
          item.cantidad,
          item.subtotal
        );
      }
    }
  }

  for (const order of cancelledOrders) {
    for (const item of order.items) {
      addMetric(cancelledProducts, item.id_producto, item.imagen, item.nombre, item.cantidad, item.subtotal);
      addMeasure(cancelledProducts, item.id_producto, item.medida_seleccionada);
    }
  }

  const topSoldProducts = sortTop(soldProducts);
  const topCancelledProducts = sortTop(cancelledProducts);

  return {
    cancelledPotential,
    cancelledTotal: cancelledOrders.length,
    confirmedOrders: confirmedOrders.length,
    expensesTotal,
    grossRevenue,
    netRevenue: grossRevenue - expensesTotal,
  topCancelledProducts: topCancelledProducts.slice(0, 5),
  topMeasures: sortTop(measures).slice(0, 5),
  topSoldProducts: topSoldProducts.slice(0, 5),
  lowSoldProducts: topSoldProducts.length > 1 ? [...topSoldProducts].reverse().slice(0, 5) : [],
  };
}
