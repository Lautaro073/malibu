"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Megaphone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const { getFirestore, doc, getDoc } = await import("firebase/firestore");
        const { getFirebaseClientApp } = await import("@/lib/firebase/client");
        const db = getFirestore(getFirebaseClientApp());
        const docRef = doc(db, "settings", "banner");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setEnabled(typeof data.enabled === "boolean" ? data.enabled : false);
          setText(data.text || "");
        }
      } catch (err) {
        console.error("Error loading banner settings:", err);
        setError("No se pudieron cargar los ajustes del banner.");
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const { getFirebaseClientApp } = await import("@/lib/firebase/client");
      const db = getFirestore(getFirebaseClientApp());
      const docRef = doc(db, "settings", "banner");

      await setDoc(docRef, {
        enabled,
        text: text.trim(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving banner settings:", err);
      setError("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-md border-zinc-300 shadow-none">
        <CardContent className="flex items-center gap-3 px-6 py-10 text-sm text-zinc-500 justify-center">
          <LoaderCircle className="size-4 animate-spin text-black" />
          Cargando configuración...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-md border-zinc-300 shadow-none">
      <CardHeader className="border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-700">
            <Megaphone className="size-5" />
          </div>
          <div>
            <CardTitle>Banner Promocional</CardTitle>
            <CardDescription>
              Configura el mensaje que aparece debajo del menú principal en toda la tienda.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="space-y-6 pt-6">
          {error ? (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-800">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
              ¡Ajustes guardados correctamente! El banner ya está actualizado en la tienda.
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-black">Activar Banner</Label>
              <p className="text-xs text-zinc-500">
                Muestra u oculta el mensaje promocional en la tienda de forma inmediata.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-text">Mensaje del Banner</Label>
            <Input
              id="banner-text"
              placeholder="Ej: ¡3 CUOTAS SIN INTERÉS Y ENVÍO GRATIS EN COMPRAS MAYORES A $90.000!"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!enabled}
              required={enabled}
            />
            <p className="text-xs text-zinc-500">
              Recomendamos usar mayúsculas para un aspecto más impactante y prolijo.
            </p>
          </div>
        </CardContent>

        <CardFooter className="border-t border-zinc-200 bg-zinc-50/50 px-6 py-4">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-black text-white hover:bg-zinc-900">
            {saving ? (
              <>
                <LoaderCircle className="size-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
