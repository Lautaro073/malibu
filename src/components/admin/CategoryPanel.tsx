import { useState, type ChangeEvent, type FormEvent } from "react";
import { ChevronDown, LoaderCircle, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
import type { Category, CategoryFormState } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CategoryPanelProps {
  categories: Category[];
  categoryForm: CategoryFormState;
  editingCategoryId: string;
  isPending: boolean;
  categorySubmitting: boolean;
  onFieldChange: (field: keyof CategoryFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onEdit: (category: Category) => void;
  onRequestDelete: (category: Category) => void;
}

const ITEMS_PER_PAGE = 5;

export function CategoryPanel({
  categories,
  categoryForm,
  editingCategoryId,
  isPending,
  categorySubmitting,
  onFieldChange,
  onSubmit,
  onCancel,
  onEdit,
  onRequestDelete,
}: CategoryPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [prevEditingCategoryId, setPrevEditingCategoryId] = useState(editingCategoryId);
  const [searchQuery, setSearchQuery] = useState("");

  if (editingCategoryId !== prevEditingCategoryId) {
    setPrevEditingCategoryId(editingCategoryId);
    if (editingCategoryId) {
      setFormOpen(true);
    } else {
      setFormOpen(false);
    }
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFieldChange("nombre_categoria", event.target.value);
  };

  const filteredCategories = categories.filter((category) =>
    category.nombre_categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="overflow-hidden rounded-md border-zinc-300 shadow-none">
          <CardHeader
            className="cursor-pointer border-b border-zinc-200 pb-4 lg:cursor-default"
            onClick={() => setFormOpen((prev) => !prev)}
          >
            <div className="flex w-full items-center justify-between gap-4">
              {/* Contenido Principal: Título y Botón Opcional */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle>
                    {editingCategoryId ? "Actualizar Categoria" : "Agregar Categoria"}
                  </CardTitle>
                  <CardDescription>
                    {editingCategoryId ? "Actualizar la Categoria" : "Agregar nueva Categoria"}
                  </CardDescription>
                </div>

                {editingCategoryId ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-9 w-fit text-xs shrink-0 gap-1.5" 
                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                  >
                    <Plus className="size-3.5" />
                    <span>Volver a agregar</span>
                  </Button>
                ) : null}
              </div>

              {/* Chevron de Expandir siempre al final */}
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-zinc-500 transition-transform",
                  formOpen && "rotate-180",
                  "lg:hidden"
                )}
              />
            </div>
          </CardHeader>

          <form onSubmit={onSubmit} className={cn("lg:block", formOpen ? "block" : "hidden")}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nombre de la Categoria</Label>
                <Input
                  id="category-name"
                  placeholder="Ingrese nombre de la categoria"
                  value={categoryForm.nombre_categoria}
                  onChange={handleNameChange}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 border-t border-zinc-200 pt-4 sm:flex-row">
              {editingCategoryId ? (
                <>
                  <Button className="w-full" type="submit" disabled={isPending}>
                    {categorySubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
                    {categorySubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button className="w-full" variant="outline" type="button" onClick={onCancel}>
                    <Plus />
                    Volver a agregar
                  </Button>
                </>
              ) : (
                <Button className="w-full" type="submit" disabled={isPending}>
                  {categorySubmitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
                  {categorySubmitting ? "Guardando..." : "Agregar Categoria"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="flex flex-col overflow-hidden rounded-md border-zinc-300 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Categorias ({filteredCategories.length})</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar categorias..."
                  className="pl-9 h-9 rounded-md border-zinc-300 focus:border-black focus:ring-0 text-xs w-full"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.length > 0 ? (
                  paginatedCategories.map((category) => (
                    <TableRow key={category.id_categoria} className="group">
                      <TableCell className="font-medium">{category.nombre_categoria}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => onEdit(category)}
                            type="button"
                          >
                            <span className="sr-only">Editar</span>
                            <Pencil />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 hover:bg-zinc-100"
                            onClick={() => onRequestDelete(category)}
                            type="button"
                          >
                            <span className="sr-only">Eliminar</span>
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-zinc-500">
                      No hay categorias disponibles.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>

          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 sm:px-6">
            <div className="text-sm text-zinc-500">
              Página {currentPage} de {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
