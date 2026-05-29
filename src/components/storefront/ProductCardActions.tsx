"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { ProductQuickViewTrigger } from "@/components/storefront/ProductQuickViewTrigger";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getProductHref } from "@/lib/storefront";
import type { Product } from "@/types/domain";
import { getProductVariants } from "@/lib/storefront";
import { toggleMeasureSelection } from "@/lib/storefront/measure-selection";

interface ProductCardActionsProps {
  product: Product;
  categoryName?: string;
  interactiveMode?: "link" | "quick-view";
}

export function ProductCardActions({ product, categoryName, interactiveMode = "link" }: ProductCardActionsProps) {
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);
  const hasMeasures = product.medidas.length > 0;
  const measureLabel = product.medidas.length > 1 ? "Talles" : "Talle";
  const variants = getProductVariants(product);
  const stockByMeasure = Object.fromEntries(
    variants.map((variant) => [variant.medida, variant.stock])
  );

  const productHref = getProductHref(product);

  const viewButton = interactiveMode === "link" ? (
    <ActionTooltip label="Ver detalle de la prenda">
      <Link
        href={productHref}
        className={buttonVariants({ variant: "outline", className: "flex-1" })}
      >
        <Eye className="mr-2 h-4 w-4" />
        Ver
      </Link>
    </ActionTooltip>
  ) : (
    <ProductQuickViewTrigger
      product={product}
      categoryName={categoryName}
      className={buttonVariants({ variant: "outline", className: "flex-1 flex items-center justify-center gap-2" })}
    >
      <Eye className="h-4 w-4" />
      Ver
    </ProductQuickViewTrigger>
  );

  /* ── Mobile-only single button (original behavior) ── */
  const mobileButton = () => {
    if (hasMeasures && selectedMeasures.length === 0) {
      if (interactiveMode === "link") {
        return (
          <ActionTooltip label="Ver detalle de la prenda">
            <Link
              href={productHref}
              className={buttonVariants({ variant: "default", className: "w-full" })}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver prenda
            </Link>
          </ActionTooltip>
        );
      }
      return (
        <ProductQuickViewTrigger
          product={product}
          categoryName={categoryName}
          className={buttonVariants({ variant: "default", className: "w-full flex items-center justify-center gap-2" })}
        >
          <Eye className="h-4 w-4" />
          Ver prenda
        </ProductQuickViewTrigger>
      );
    }
    return (
      <AddToCartButton
        key={selectedMeasures.join("-") || "sin-talle"}
        productId={product.id_producto}
        stock={product.stock}
        selectedMeasures={selectedMeasures}
        stockByMeasure={stockByMeasure}
        requiresMeasure={hasMeasures}
        className="w-full"
      />
    );
  };

  return (
    <div className="space-y-3">
      {hasMeasures ? (
        <div className="hidden min-h-[74px] space-y-2 text-left sm:flex sm:min-h-[34px] sm:items-center sm:gap-3 sm:space-y-0">
          <p className="shrink-0 text-[11px] text-zinc-500 sm:text-xs">{measureLabel}</p>
          <div className="flex flex-wrap gap-2" aria-label={measureLabel}>
            {variants.map((variant) => {
              const isSelected = selectedMeasures.includes(variant.medida);

              return (
                <ActionTooltip
                  key={variant.medida}
                  label={
                    variant.stock <= 0
                      ? `Talle ${variant.medida} sin stock`
                      : isSelected
                        ? `Quitar talle ${variant.medida}`
                        : `Elegir talle ${variant.medida}`
                  }
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      setSelectedMeasures((current) =>
                        toggleMeasureSelection(current, variant.medida)
                      )
                    }
                    disabled={variant.stock <= 0}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : variant.stock <= 0
                          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                          : "border-zinc-300 bg-white text-black hover:border-black"
                    }`}
                  >
                    {variant.medida}
                  </button>
                </ActionTooltip>
              );
            })}
          </div>
        </div>
      ) : (
        <div aria-hidden="true" className="hidden h-[74px] sm:block sm:h-[34px]" />
      )}

      {/* Mobile: single button (original behavior) */}
      <div className="sm:hidden">
        {mobileButton()}
      </div>

      {/* Desktop: two buttons side by side */}
      <div className="hidden gap-2 sm:flex">
        <AddToCartButton
          key={selectedMeasures.join("-") || "sin-talle"}
          productId={product.id_producto}
          stock={product.stock}
          selectedMeasures={selectedMeasures}
          stockByMeasure={stockByMeasure}
          requiresMeasure={hasMeasures}
          className="flex-1"
        />
        {viewButton}
      </div>
    </div>
  );
}
