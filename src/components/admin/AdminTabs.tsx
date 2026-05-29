import type { ReactNode } from "react";
import { ClipboardList, Package, Settings, Tags } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { id: "products", label: "Prendas", icon: Package },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "categories", label: "Categorias", icon: Tags },
  { id: "settings", label: "Ajustes", icon: Settings },
] as const;

export type AdminTab = (typeof TABS)[number]["id"];

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (value: string) => void;
  productsContent: ReactNode;
  ordersContent: ReactNode;
  categoriesContent: ReactNode;
  settingsContent: ReactNode;
}

export function AdminTabs({
  activeTab,
  onChange,
  productsContent,
  ordersContent,
  categoriesContent,
  settingsContent,
}: AdminTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onChange}>
      <TabsList className="grid h-auto w-full grid-cols-2 rounded-md border border-zinc-300 bg-white p-1 md:grid-cols-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 rounded-sm px-3 py-2 text-sm"
            >
              <Icon className="size-4 shrink-0" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="products">{productsContent}</TabsContent>
      <TabsContent value="orders">{ordersContent}</TabsContent>
      <TabsContent value="categories">{categoriesContent}</TabsContent>
      <TabsContent value="settings">{settingsContent}</TabsContent>
    </Tabs>
  );
}
