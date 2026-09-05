"use client";

import { useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  selectedMeasure?: string | null;
  selectedMeasures?: string[];
  stockByMeasure?: Record<string, number>;
  requiresMeasure?: boolean;
  onAdded?: () => void;
  className?: string;
}

export function AddToCartButton({
  productId,
  stock,
  selectedMeasure,
  selectedMeasures,
  stockByMeasure,
  requiresMeasure = false,
  onAdded,
  className,
}: AddToCartButtonProps) {
  const { addItem, getProductQuantity, isReady } = useStoreCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedMeasureList =
    selectedMeasures && selectedMeasures.length > 0
      ? selectedMeasures
      : selectedMeasure
        ? [selectedMeasure]
        : [];
  const missingMeasure = requiresMeasure && selectedMeasureList.length === 0;
  const quantityInCart = getProductQuantity(productId, selectedMeasure);
  const stockReached =
    selectedMeasureList.length > 0 && stockByMeasure
      ? selectedMeasureList.some(
          (measure) => getProductQuantity(productId, measure) >= (stockByMeasure[measure] ?? 0)
        )
      : stock > 0 && quantityInCart >= stock;
  const disabledReason = !isReady
    ? "Preparando carrito..."
    : missingMeasure
      ? "Elige un talle antes de añadir al carrito."
    : stock <= 0 && selectedMeasureList.length === 0
      ? "Este producto no tiene stock."
      : stockReached
        ? "Ya agregaste el maximo disponible."
        : null;
  const isDisabled = Boolean(disabledReason) || isSubmitting;
  const idleLabel =
    missingMeasure
      ? "Elegi un talle"
      : stock <= 0 && selectedMeasureList.length === 0
        ? "Sin stock"
        : stockReached
          ? "Sin stock"
          : selectedMeasureList.length > 1
            ? `Añadir ${selectedMeasureList.length} talles`
            : "Añadir al carrito";

  async function handleAdd(): Promise<void> {
    try {
      setIsSubmitting(true);

      if (selectedMeasureList.length > 0) {
        for (const measure of selectedMeasureList) {
          await addItem(productId, 1, measure);
        }
      } else {
        await addItem(productId, 1, selectedMeasure);
      }

      onAdded?.();
    } catch {
      // The button is intentionally silent in card contexts.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      {disabledReason ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block w-full" tabIndex={0}>
                <Button type="button" className={className} disabled>
                  <ShoppingBag />
                  {idleLabel}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{disabledReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <ActionTooltip label="Agregar al carrito">
          <Button
            type="button"
            className={className}
            disabled={isDisabled}
            onClick={() => {
              void handleAdd();
            }}
          >
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />}
            {isSubmitting ? "Agregando..." : idleLabel}
          </Button>
        </ActionTooltip>
      )}
    </div>
  );
}
