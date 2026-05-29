import { NextResponse } from "next/server";
import {
  deleteProduct,
  getProductById,
  restoreProduct,
  updateProduct,
} from "@/lib/catalog/service";
import { requireAdmin } from "@/lib/auth/admin";
import { toErrorResponse } from "@/lib/api/errors";
import { parseCatalogRequest } from "@/lib/catalog/request";
import { stripInternalProductFields } from "@/lib/catalog/serializers";
import type { RouteContext } from "@/types/next";

interface ProductParams {
  id: string;
}

export async function GET(_request: Request, context: RouteContext<ProductParams>) {
  try {
    const { id } = await context.params;
    const producto = await getProductById(id);

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(stripInternalProductFields(producto));
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al obtener el producto");
  }
}

export async function PUT(request: Request, context: RouteContext<ProductParams>) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const { payload, images } = await parseCatalogRequest(request);
    const producto = await updateProduct(id, payload, images);

    return NextResponse.json(producto);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al actualizar el producto");
  }
}

export async function DELETE(request: Request, context: RouteContext<ProductParams>) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const producto = await deleteProduct(id);

    return NextResponse.json(producto);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al desactivar el producto");
  }
}

export async function PATCH(request: Request, context: RouteContext<ProductParams>) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;

    if (payload.action !== "restore") {
      return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
    }

    const producto = await restoreProduct(id);
    return NextResponse.json(producto);
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al reactivar el producto");
  }
}
