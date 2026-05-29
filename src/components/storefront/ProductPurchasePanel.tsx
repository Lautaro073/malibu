"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { Product } from "@/types/domain";
import { getProductVariants } from "@/lib/storefront";
import { toggleMeasureSelection } from "@/lib/storefront/measure-selection";

interface ProductPurchasePanelProps {
  product: Product;
  className?: string;
}

export function ProductPurchasePanel({
  product,
  className,
}: ProductPurchasePanelProps) {
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);
  const hasMeasures = product.medidas.length > 0;
  const variants = getProductVariants(product);
  const stockByMeasure = Object.fromEntries(
    variants.map((variant) => [variant.medida, variant.stock])
  );

  return (
    <div className="space-y-4">
      {hasMeasures ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-black">Elige tu talle</p>
            <p className="text-sm text-zinc-500">
              Puedes elegir uno o varios talles antes de agregar al carrito.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Elige tu talle">
            {variants.map((variant) => {
              const isSelected = selectedMeasures.includes(variant.medida);

              return (
                <button
                  key={variant.medida}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    setSelectedMeasures((current) =>
                      toggleMeasureSelection(current, variant.medida)
                    )
                  }
                  disabled={variant.stock <= 0}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : variant.stock <= 0
                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                        : "border-zinc-300 bg-white text-black hover:border-black"
                  }`}
                >
                  {variant.medida}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <AddToCartButton
        key={selectedMeasures.join("-") || "sin-talle"}
        productId={product.id_producto}
        stock={product.stock}
        selectedMeasures={selectedMeasures}
        stockByMeasure={stockByMeasure}
        requiresMeasure={hasMeasures}
        className={className}
      />
    </div>
  );
}
