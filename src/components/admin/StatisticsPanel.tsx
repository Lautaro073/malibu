"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { ChevronDown, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAdminStatistics } from "@/lib/admin/statistics";
import { formatCurrency } from "@/lib/storefront";
import type { AdminExpense, AdminExpenseCategory, OrderSummary } from "@/types/domain";

interface StatisticsPanelProps {
  expenses: AdminExpense[];
  expenseDeletingId: string;
  expenseSubmitting: boolean;
  orders: OrderSummary[];
  onCreateExpense: (input: {
    categoria: AdminExpenseCategory;
    concepto: string;
    monto: string;
  }) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const EXPENSE_CATEGORIES: { label: string; value: AdminExpenseCategory }[] = [
  { label: "Mercaderia", value: "mercaderia" },
  { label: "Servicios", value: "servicios" },
  { label: "Insumos", value: "insumos" },
  { label: "Local", value: "local" },
  { label: "Otros", value: "otros" },
];

function formatDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(value));
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function categoryLabel(value: AdminExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((category) => category.value === value)?.label || "Otros";
}

function RankingList({
  empty,
  items,
  variant = "product",
}: {
  empty: string;
  items: {
    id: string;
    image: string | null;
    label: string;
    measures: string[];
    quantity: number;
    total: number;
  }[];
  variant?: "product" | "measure";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{empty}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-2"
        >
          <div className="flex min-w-0 items-center gap-3">
            {variant === "product" ? (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    unoptimized
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[10px] font-semibold uppercase text-zinc-400">
                    Sin
                  </div>
                )}
              </div>
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-bold text-black">
                {item.label}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-black">{item.label}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {item.quantity === 1 ? "1 unidad" : `${item.quantity} unidades`}
              </p>
              {variant === "product" && item.measures.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.measures.map((measure) => (
                    <Badge key={measure} variant="secondary" className="text-[10px]">
                      Talle {measure}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {variant === "product" ? (
            <Badge variant="outline" className="shrink-0">
              {formatCurrency(item.total)}
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function StatisticsPanel({
  expenses,
  expenseDeletingId,
  expenseSubmitting,
  orders,
  onCreateExpense,
  onDeleteExpense,
}: StatisticsPanelProps) {
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<AdminExpenseCategory>("mercaderia");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<AdminExpenseCategory | "all">("all");
  const summary = useMemo(() => buildAdminStatistics(orders, expenses), [expenses, orders]);
  const expensesByCategory = useMemo(
    () =>
      EXPENSE_CATEGORIES.map((currentCategory) => ({
        ...currentCategory,
        total: expenses
          .filter((expense) => expense.categoria === currentCategory.value)
          .reduce((total, expense) => total + expense.monto, 0),
      })),
    [expenses]
  );
  const filteredExpenses = useMemo(() => {
    const normalizedSearch = normalizeText(expenseSearch);

    return expenses.filter((expense) => {
      const matchesCategory =
        expenseCategoryFilter === "all" || expense.categoria === expenseCategoryFilter;
      const matchesSearch =
        !normalizedSearch || normalizeText(expense.concepto).includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [expenseCategoryFilter, expenseSearch, expenses]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onCreateExpense({
      categoria: category,
      concepto: concept,
      monto: amount,
    });
    setConcept("");
    setAmount("");
    setCategory("mercaderia");
    setExpenseDialogOpen(false);
    setExpensesOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Ingresos confirmados</p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {formatCurrency(summary.grossRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Gastos</p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {formatCurrency(summary.expensesTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Ganancia estimada</p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {formatCurrency(summary.netRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Pedidos confirmados</p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {summary.confirmedOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Mas vendido</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList empty="Todavia no hay ventas confirmadas." items={summary.topSoldProducts} />
          </CardContent>
        </Card>
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Menos vendido</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList
              empty="Se necesitan al menos 2 prendas vendidas para comparar."
              items={summary.lowSoldProducts}
            />
          </CardContent>
        </Card>
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Mas pedido y cancelado</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList empty="No hay pedidos cancelados." items={summary.topCancelledProducts} />
          </CardContent>
        </Card>
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Talles mas pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList
              empty="Todavia no hay talles vendidos."
              items={summary.topMeasures}
              variant="measure"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border-zinc-300 shadow-none">
        <button
          type="button"
          onClick={() => setExpensesOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        >
          <div>
            <CardTitle className="text-base">Control de gastos</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Revisa en que se esta yendo el dinero y compara la salida con las ventas.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline">{expenses.length}</Badge>
            <ChevronDown
              className={`size-5 text-zinc-500 transition-transform ${expensesOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {expensesOpen ? (
          <CardContent className="border-t border-zinc-200 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="expense-search">Buscar gasto</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="expense-search"
                      value={expenseSearch}
                      onChange={(event) => setExpenseSearch(event.target.value)}
                      placeholder="Buscar por concepto..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expense-category-filter">Categoria</Label>
                  <select
                    id="expense-category-filter"
                    value={expenseCategoryFilter}
                    onChange={(event) =>
                      setExpenseCategoryFilter(event.target.value as AdminExpenseCategory | "all")
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-zinc-200"
                  >
                    <option value="all">Todas</option>
                    {EXPENSE_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ActionTooltip label="Cargar un gasto nuevo">
                <Button type="button" onClick={() => setExpenseDialogOpen(true)}>
                  <Plus />
                  Agregar gasto
                </Button>
              </ActionTooltip>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
              {expensesByCategory.map((item) => (
                <div key={item.value} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-black">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-md border border-zinc-200">
              <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:grid">
                <span>Concepto</span>
                <span>Categoria</span>
                <span>Fecha</span>
                <span className="text-right">Monto</span>
                <span className="text-right">Accion</span>
              </div>
              <div className="max-h-96 divide-y divide-zinc-200 overflow-y-auto">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <div
                      key={expense.id_gasto}
                      className="grid gap-2 px-3 py-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-black">{expense.concepto}</p>
                        <p className="text-xs text-zinc-500 md:hidden">
                          {categoryLabel(expense.categoria)} · {formatDate(expense.created_at)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="w-fit md:justify-self-start">
                        {categoryLabel(expense.categoria)}
                      </Badge>
                      <span className="hidden text-sm text-zinc-600 md:block">
                        {formatDate(expense.created_at)}
                      </span>
                      <span className="text-sm font-semibold text-black md:text-right">
                        {formatCurrency(expense.monto)}
                      </span>
                      <ActionTooltip label="Eliminar gasto">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 justify-self-end"
                          disabled={expenseDeletingId === expense.id_gasto}
                          onClick={() => onDeleteExpense(expense.id_gasto)}
                        >
                          {expenseDeletingId === expense.id_gasto ? (
                            <LoaderCircle className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                          <span className="sr-only">Eliminar gasto</span>
                        </Button>
                      </ActionTooltip>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-zinc-500">
                    No hay gastos para esos filtros.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar gasto</DialogTitle>
            <DialogDescription>
              Carga solo lo necesario para que la ganancia estimada sea mas real.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="expense-concept">Concepto</Label>
              <Input
                id="expense-concept"
                value={concept}
                onChange={(event) => setConcept(event.target.value)}
                placeholder="Ej: bolsas, luz, mercaderia"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Monto</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-category">Categoria</Label>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as AdminExpenseCategory)}
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-zinc-200"
                >
                  {EXPENSE_CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setExpenseDialogOpen(false)}
                disabled={expenseSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={expenseSubmitting}>
                {expenseSubmitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
                {expenseSubmitting ? "Agregando..." : "Agregar gasto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
