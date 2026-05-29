import { LoaderCircle } from "lucide-react";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  targetType: "category" | "product" | null;
  targetLabel: string;
  error: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  targetType,
  targetLabel,
  error,
  isPending,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const title =
    targetType === "category" ? "Desactivar categoria" : "Desactivar producto";
  const description =
    targetType === "category"
      ? "La categoria dejara de verse en la tienda. Los pedidos anteriores no cambian."
      : "La prenda dejara de verse en la tienda. Los pedidos anteriores no cambian.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {targetLabel ? (
            <>
              Elemento seleccionado: <strong>{targetLabel}</strong>
            </>
          ) : (
            "No hay un elemento seleccionado."
          )}
        </div>

        {error ? (
          <div className="mt-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <ActionTooltip label="Cerrar sin desactivar">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </ActionTooltip>
          <ActionTooltip label="Ocultar de la tienda sin borrar historial">
            <Button
              type="button"
              className="bg-zinc-900 hover:bg-black"
              onClick={onConfirm}
              disabled={isPending || !targetLabel}
            >
              {isPending ? <LoaderCircle className="animate-spin" /> : null}
              {isPending ? "Desactivando..." : "Desactivar"}
            </Button>
          </ActionTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
