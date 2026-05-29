import type { ReactNode } from "react";
import { BarChart3, ClipboardList, Package, Settings, Tags } from "lucide-react";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { id: "products", label: "Prendas", icon: Package },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "statistics", label: "Estadisticas", icon: BarChart3 },
  { id: "categories", label: "Categorias", icon: Tags },
  { id: "settings", label: "Ajustes", icon: Settings },
] as const;

export type AdminTab = (typeof TABS)[number]["id"];

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (value: string) => void;
  productsContent: ReactNode;
  ordersContent: ReactNode;
  statisticsContent: ReactNode;
  categoriesContent: ReactNode;
  settingsContent: ReactNode;
}

export function AdminTabs({
  activeTab,
  onChange,
  productsContent,
  ordersContent,
  statisticsContent,
  categoriesContent,
  settingsContent,
}: AdminTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onChange}>
      <TabsList className="flex h-auto w-full justify-start overflow-x-auto rounded-md border border-zinc-300 bg-white p-1 [scrollbar-width:none] md:grid md:grid-cols-5 [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <ActionTooltip key={tab.id} label={`Ir a ${tab.label.toLowerCase()}`}>
              <TabsTrigger
                value={tab.id}
                className="min-w-max gap-2 rounded-sm px-3 py-2 text-sm"
              >
                <Icon className="size-4 shrink-0" />
                {tab.label}
              </TabsTrigger>
            </ActionTooltip>
          );
        })}
      </TabsList>

      <TabsContent value="products">{productsContent}</TabsContent>
      <TabsContent value="orders">{ordersContent}</TabsContent>
      <TabsContent value="statistics">{statisticsContent}</TabsContent>
      <TabsContent value="categories">{categoriesContent}</TabsContent>
      <TabsContent value="settings">{settingsContent}</TabsContent>
    </Tabs>
  );
}
