import { LogOut } from "lucide-react";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  email: string;
  onLogout: () => void;
}

export function AdminHeader({ email, onLogout }: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-300 pb-3">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-black">Panel de administracion</h1>
        {email ? (
          <span className="hidden rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-500 sm:inline-block">
            {email}
          </span>
        ) : null}
      </div>

      <ActionTooltip label="Salir del panel de administracion">
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="border-zinc-300 bg-white text-black hover:bg-zinc-100"
          type="button"
        >
          <LogOut />
          Cerrar sesion
        </Button>
      </ActionTooltip>
    </header>
  );
}
