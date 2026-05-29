import type { DocumentData } from "firebase-admin/firestore";
import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import type {
  AdminExpense,
  AdminExpenseCategory,
  FirebaseDateLike,
  RawAdminExpenseRecord,
} from "@/types/domain";
import { isRecord } from "@/types/shared";

const EXPENSE_CATEGORIES: AdminExpenseCategory[] = [
  "mercaderia",
  "servicios",
  "insumos",
  "local",
  "otros",
];

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(value: unknown): number {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createHttpError(400, "El monto del gasto debe ser mayor a cero.");
  }

  return Math.round(amount);
}

function parseCategory(value: unknown): AdminExpenseCategory {
  return EXPENSE_CATEGORIES.includes(value as AdminExpenseCategory)
    ? (value as AdminExpenseCategory)
    : "otros";
}

function readDateField(data: DocumentData, field: string): FirebaseDateLike {
  const value = data[field];

  if (
    value instanceof Date ||
    typeof value === "string" ||
    (isRecord(value) && "toDate" in value)
  ) {
    return value as FirebaseDateLike;
  }

  return undefined;
}

function toIsoString(value: FirebaseDateLike): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toRawExpenseRecord(id: string, data: DocumentData): RawAdminExpenseRecord {
  return {
    id,
    concept: safeString(data.concept),
    amount: data.amount ?? 0,
    category: parseCategory(data.category),
    createdAt: readDateField(data, "createdAt"),
  };
}

function serializeExpense(expense: RawAdminExpenseRecord): AdminExpense {
  return {
    id_gasto: expense.id,
    concepto: expense.concept,
    monto: Number(expense.amount) || 0,
    categoria: expense.category,
    created_at: toIsoString(expense.createdAt),
  };
}

export async function listAdminExpenses(): Promise<AdminExpense[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("adminExpenses").orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => serializeExpense(toRawExpenseRecord(doc.id, doc.data())));
}

export async function createAdminExpense(input: unknown): Promise<AdminExpense> {
  if (!isRecord(input)) {
    throw createHttpError(400, "Datos de gasto invalidos.");
  }

  const concept = safeString(input.concepto ?? input.concept);

  if (!concept) {
    throw createHttpError(400, "El concepto del gasto es requerido.");
  }

  const amount = parseAmount(input.monto ?? input.amount);
  const category = parseCategory(input.categoria ?? input.category);
  const db = getFirebaseAdminDb();
  const createdAt = new Date();
  const ref = await db.collection("adminExpenses").add({
    amount,
    category,
    concept,
    createdAt,
  });

  return serializeExpense({
    id: ref.id,
    amount,
    category,
    concept,
    createdAt,
  });
}

export async function deleteAdminExpense(id: string): Promise<void> {
  if (!id) {
    throw createHttpError(400, "Gasto invalido.");
  }

  await getFirebaseAdminDb().collection("adminExpenses").doc(id).delete();
}
