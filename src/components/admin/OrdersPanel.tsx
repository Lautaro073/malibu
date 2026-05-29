"use client";

import { Check, X } from "lucide-react";
import { OrderItemThumbnail } from "@/components/customer/OrderItemThumbnail";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDefaultAdminOrderStatusFilter,
  type AdminOrderStatusFilter,
} from "@/lib/orders/filters";
import { formatCurrency } from "@/lib/storefront";
import { useEffect, useMemo, useState } from "react";
import type { OrderSummary } from "@/types/domain";

interface OrdersPanelProps {
  orders: OrderSummary[];
  orderSubmittingId: string;
  onUpdateStatus: (orderId: string, status: "confirmed" | "cancelled") => void;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatOrderNumber(index: number): string {
  return `Pedido #${index + 1}`;
}

function getTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatQuantity(value: number): string {
  return value === 1 ? "1 unidad" : `${value} unidades`;
}

function formatOrderCount(value: number): string {
  return value === 1 ? "1 pedido" : `${value} pedidos`;
}

function getStatusLabel(status: OrderSummary["status"]): string {
  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "cancelled") {
    return "Cancelado";
  }

  return "Pendiente";
}

function getStatusVariant(status: OrderSummary["status"]): "default" | "outline" | "secondary" {
  if (status === "confirmed") {
    return "default";
  }

  if (status === "cancelled") {
    return "secondary";
  }

  return "outline";
}

function getClosedMessage(status: OrderSummary["status"]): string {
  if (status === "confirmed") {
    return "Stock descontado";
  }

  if (status === "cancelled") {
    return "No se desconto stock";
  }

  return "";
}

function getFilterEmptyMessage(status: AdminOrderStatusFilter): string {
  if (status === "pending_confirmation") {
    return "No hay pedidos para revisar.";
  }

  if (status === "confirmed") {
    return "No hay pedidos confirmados.";
  }

  return "No hay pedidos cancelados.";
}

export function OrdersPanel({ orders, orderSubmittingId, onUpdateStatus }: OrdersPanelProps) {
  const pendingCount = orders.filter((order) => order.status === "pending_confirmation").length;
  const confirmedCount = orders.filter((order) => order.status === "confirmed").length;
  const cancelledCount = orders.filter((order) => order.status === "cancelled").length;
  const defaultFilter = getDefaultAdminOrderStatusFilter({
    pending: pendingCount,
    confirmed: confirmedCount,
    cancelled: cancelledCount,
  });
  const [activeFilter, setActiveFilter] = useState<AdminOrderStatusFilter>(defaultFilter);
  const filteredOrders = useMemo(
    () => orders.filter((order) => order.status === activeFilter),
    [activeFilter, orders]
  );
  const orderNumberById = useMemo(() => {
    const orderedByCreation = [...orders].sort((left, right) => {
      const byDate = getTimestamp(left.created_at) - getTimestamp(right.created_at);
      return byDate !== 0 ? byDate : left.id_orden.localeCompare(right.id_orden);
    });

    return new Map(
      orderedByCreation.map((order, index) => [order.id_orden, formatOrderNumber(index)])
    );
  }, [orders]);

  useEffect(() => {
    setActiveFilter(defaultFilter);
  }, [defaultFilter]);

  return (
    <Card className="rounded-lg border-zinc-300 shadow-none">
      <CardHeader className="gap-2 border-b border-zinc-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Pedidos</CardTitle>
            <p className="mt-1 text-sm text-zinc-600">
              Pedidos que llegaron desde WhatsApp.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {formatOrderCount(orders.length)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {orders.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
            Todavia no hay pedidos registrados.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <ActionTooltip label="Ver pedidos para revisar">
                <button
                  type="button"
                  onClick={() => setActiveFilter("pending_confirmation")}
                  className={`rounded-md border px-2 py-2 text-left transition-colors sm:px-3 sm:py-3 ${
                    activeFilter === "pending_confirmation"
                      ? "border-black bg-white"
                      : "border-zinc-200 bg-zinc-50 hover:bg-white"
                  }`}
                >
                  <p className="truncate text-[11px] text-zinc-500 sm:text-xs">
                    <span className="sm:hidden">Revisar</span>
                    <span className="hidden sm:inline">Para revisar</span>
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-black sm:mt-1 sm:text-xl">
                    {pendingCount}
                  </p>
                </button>
              </ActionTooltip>
              <ActionTooltip label="Ver pedidos confirmados">
                <button
                  type="button"
                  onClick={() => setActiveFilter("confirmed")}
                  className={`rounded-md border px-2 py-2 text-left transition-colors sm:px-3 sm:py-3 ${
                    activeFilter === "confirmed"
                      ? "border-black bg-white"
                      : "border-zinc-200 bg-zinc-50 hover:bg-white"
                  }`}
                >
                  <p className="truncate text-[11px] text-zinc-500 sm:text-xs">
                    <span className="sm:hidden">Confirmados</span>
                    <span className="hidden sm:inline">Confirmados</span>
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-black sm:mt-1 sm:text-xl">
                    {confirmedCount}
                  </p>
                </button>
              </ActionTooltip>
              <ActionTooltip label="Ver pedidos cancelados">
                <button
                  type="button"
                  onClick={() => setActiveFilter("cancelled")}
                  className={`rounded-md border px-2 py-2 text-left transition-colors sm:px-3 sm:py-3 ${
                    activeFilter === "cancelled"
                      ? "border-black bg-white"
                      : "border-zinc-200 bg-zinc-50 hover:bg-white"
                  }`}
                >
                  <p className="truncate text-[11px] text-zinc-500 sm:text-xs">
                    <span className="sm:hidden">Cancelados</span>
                    <span className="hidden sm:inline">Cancelados</span>
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-black sm:mt-1 sm:text-xl">
                    {cancelledCount}
                  </p>
                </button>
              </ActionTooltip>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
                {getFilterEmptyMessage(activeFilter)}
              </div>
            ) : null}

            {filteredOrders.map((order) => {
              const isSubmitting = orderSubmittingId === order.id_orden;
              const isPending = order.status === "pending_confirmation";

              return (
                <article
                  key={order.id_orden}
                  className="overflow-hidden rounded-md border border-zinc-300 bg-white"
                >
                  <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-black">
                        {orderNumberById.get(order.id_orden) || "Pedido"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">{formatDate(order.created_at)}</p>
                    </div>
                    <Badge
                      variant={getStatusVariant(order.status)}
                      className="w-fit px-3 py-1 text-sm"
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  <div className="divide-y divide-zinc-200">
                    {order.items.map((item) => (
                      <div
                        key={item.clave}
                        className="grid grid-cols-[64px_1fr] gap-3 px-4 py-4 sm:grid-cols-[72px_1fr_auto] sm:items-center"
                      >
                        <OrderItemThumbnail
                          alt={item.nombre}
                          src={item.imagen}
                          size={64}
                          className="rounded-md"
                        />
                        <div className="min-w-0 space-y-2">
                          <p className="text-sm font-semibold text-black">{item.nombre}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{formatQuantity(item.cantidad)}</Badge>
                            {item.medida_seleccionada ? (
                              <Badge variant="outline">Talle {item.medida_seleccionada}</Badge>
                            ) : null}
                          </div>
                        </div>
                        <p className="col-span-2 text-right text-sm font-semibold text-black sm:col-span-1">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-zinc-200 px-4 py-4">
                    <div className="flex items-center justify-between gap-3 text-base font-semibold text-black">
                      <span>Total</span>
                      <span>{formatCurrency(order.pricing.total ?? order.pricing.subtotal)}</span>
                    </div>

                    {isPending ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <ActionTooltip label="Confirmar y descontar stock">
                          <Button
                            type="button"
                            className="h-11 w-full"
                            onClick={() => onUpdateStatus(order.id_orden, "confirmed")}
                            disabled={isSubmitting}
                          >
                            <Check className="size-4" />
                            Confirmar pedido
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip label="Marcar como no concretado">
                          <Button
                            type="button"
                            className="h-11 w-full"
                            variant="outline"
                            onClick={() => onUpdateStatus(order.id_orden, "cancelled")}
                            disabled={isSubmitting}
                          >
                            <X className="size-4" />
                            Cancelar
                          </Button>
                        </ActionTooltip>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-700">
                        {getClosedMessage(order.status)}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
