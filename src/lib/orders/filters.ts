import type { OrderSummary } from "@/types/domain";

export type AdminOrderStatusFilter = OrderSummary["status"];

interface AdminOrderStatusCounts {
  cancelled: number;
  confirmed: number;
  pending: number;
}

export function getDefaultAdminOrderStatusFilter({
  pending,
}: AdminOrderStatusCounts): AdminOrderStatusFilter {
  return pending > 0 ? "pending_confirmation" : "confirmed";
}
