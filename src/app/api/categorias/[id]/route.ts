import { NextResponse } from "next/server";
import {
  deleteCategory,
  getCategoryById,
  restoreCategory,
  updateCategory,
} from "@/lib/catalog/service";
import { requireAdmin } from "@/lib/auth/admin";
import { toErrorResponse } from "@/lib/api/errors";
import type { RouteContext } from "@/types/next";

interface CategoryParams {
  id: string;
}

export async function GET(_request: Request, context: RouteContext<CategoryParams>) {
  try {
    const { id } = await context.params;
    const categoria = await getCategoryById(id);

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(categoria);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener la categoria");
  }
}

export async function PUT(request: Request, context: RouteContext<CategoryParams>) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const categoria = await updateCategory(id, payload);

    return NextResponse.json(categoria);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar la categoria");
  }
}

export async function DELETE(request: Request, context: RouteContext<CategoryParams>) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const categoria = await deleteCategory(id);

    return NextResponse.json(categoria);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al desactivar la categoria");
  }
}

export async function PATCH(request: Request, context: RouteContext<CategoryParams>) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;

    if (payload.action !== "restore") {
      return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
    }

    const categoria = await restoreCategory(id);
    return NextResponse.json(categoria);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al reactivar la categoria");
  }
}
