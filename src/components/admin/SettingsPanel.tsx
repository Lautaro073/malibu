"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Megaphone, Images, Save, Upload, Trash2, Plus } from "lucide-react";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_PRODUCT_IMAGE_SIZE_BYTES } from "@/lib/catalog/constants";
import { toast } from "sonner";

interface SlideConfig {
  image: string;
  subtitle: string;
  title: string;
}

export function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  
  // Estados del Banner
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState("");
  const [bannerSuccess, setBannerSuccess] = useState(false);
  
  // Estados del Carrusel
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [carouselSuccess, setCarouselSuccess] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  
  const [slides, setSlides] = useState<SlideConfig[]>([
    { image: "/assets/malibu.jpg", subtitle: "NUEVA TEMPORADA", title: "Malibú" },
  ]);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const { getFirestore, doc, getDoc } = await import("firebase/firestore");
        const { getFirebaseClientApp } = await import("@/lib/firebase/client");
        const db = getFirestore(getFirebaseClientApp());
        
        // Cargar Banner Settings
        const bannerRef = doc(db, "settings", "banner");
        const bannerSnap = await getDoc(bannerRef);

        if (bannerSnap.exists()) {
          const data = bannerSnap.data();
          setBannerEnabled(typeof data.enabled === "boolean" ? data.enabled : false);
          setBannerText(data.text || "");
        }

        // Cargar Carousel Settings
        const carouselRef = doc(db, "settings", "carousel");
        const carouselSnap = await getDoc(carouselRef);

        if (carouselSnap.exists()) {
          const data = carouselSnap.data();
          setCarouselEnabled(typeof data.enabled === "boolean" ? data.enabled : true);
          if (Array.isArray(data.slides) && data.slides.length > 0) {
            const loadedSlides = data.slides.map((s: any) => ({
              image: s.image || "",
              subtitle: s.subtitle || "",
              title: s.title || "",
            }));
            
            // Garantizar que el primer slide use la imagen bloqueada de Malibú
            if (loadedSlides[0]) {
              loadedSlides[0].image = "/assets/malibu.jpg";
            }
            
            setSlides(loadedSlides);
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("No se pudieron cargar todos los ajustes.");
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanner(true);
    setBannerSuccess(false);
    setError("");

    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const { getFirebaseClientApp } = await import("@/lib/firebase/client");
      const db = getFirestore(getFirebaseClientApp());
      const docRef = doc(db, "settings", "banner");

      const bannerData = {
        enabled: bannerEnabled,
        text: bannerText.trim(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, bannerData, { merge: true });

      localStorage.setItem("malibu_promo_banner", JSON.stringify(bannerData));

      toast.success("Mensaje promocional guardado correctamente.");
    } catch (err) {
      console.error("Error saving banner settings:", err);
      toast.error("No se pudieron guardar los cambios del mensaje promocional.");
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCarousel(true);
    setCarouselSuccess(false);
    setError("");

    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const { getFirebaseClientApp } = await import("@/lib/firebase/client");
      const db = getFirestore(getFirebaseClientApp());
      const docRef = doc(db, "settings", "carousel");

      const sanitizedSlides = slides.map((slide, index) => {
        let img = slide.image.trim();
        if (index === 0) {
          img = "/assets/malibu.jpg";
        }
        return {
          image: img,
          subtitle: slide.subtitle.trim(),
          title: slide.title.trim(),
        };
      }).filter(slide => slide.image !== "");

      const carouselData = {
        enabled: carouselEnabled,
        slides: sanitizedSlides,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, carouselData, { merge: true });

      localStorage.setItem("malibu_carousel_settings", JSON.stringify(carouselData));

      toast.success("Imágenes de carrusel guardadas correctamente.");
    } catch (err) {
      console.error("Error saving carousel settings:", err);
      toast.error("No se pudieron guardar los cambios del carrusel.");
    } finally {
      setSavingCarousel(false);
    }
  };

  const handleSlideChange = (index: number, field: keyof SlideConfig, value: string) => {
    setSlides(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddSlide = () => {
    setSlides(prev => [...prev, { image: "", subtitle: "", title: "" }]);
  };

  const handleRemoveSlide = (index: number) => {
    if (index === 0) return;
    setSlides(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      toast.error("La imagen debe pesar como maximo 8 MB.");
      e.target.value = "";
      return;
    }

    setUploadingIndex(index);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al subir a Cloudinary");
      }

      const data = await response.json();
      handleSlideChange(index, "image", data.imageUrl);
      toast.success("Foto subida correctamente.");
    } catch (err: any) {
      console.error("Error uploading carousel image:", err);
      toast.error("No se pudo subir la foto de campaña. Intentalo de nuevo.");
    } finally {
      setUploadingIndex(null);
      e.target.value = "";
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
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-800">
          {error}
        </div>
      ) : null}

      {/* PANEL DEL BANNER */}
      <Card className="overflow-hidden rounded-md border-zinc-300 shadow-none">
        <CardHeader className="border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-700">
              <Megaphone className="size-5" />
            </div>
            <div>
              <CardTitle>Mensaje Promocional</CardTitle>
              <CardDescription>
                Configura el mensaje que aparece debajo del menú principal en toda la tienda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveBanner}>
          <CardContent className="space-y-6 pt-6">
            {bannerSuccess ? (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 animate-fade-in">
                ¡Ajustes del mensaje guardados correctamente!
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-black">Activar Mensaje Promocional</Label>
                <p className="text-xs text-zinc-500">
                  Muestra u oculta el mensaje promocional en la tienda de forma inmediata.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={bannerEnabled}
                  onChange={(e) => setBannerEnabled(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-text">Mensaje Promocional</Label>
              <Input
                id="banner-text"
                placeholder="Ej: ¡3 CUOTAS SIN INTERÉS Y ENVÍO GRATIS EN COMPRAS MAYORES A $90.000!"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                disabled={!bannerEnabled}
                required={bannerEnabled}
              />
              <p className="text-xs text-zinc-500">
                Recomendamos usar mayúsculas para un aspecto más impactante y prolijo.
              </p>
            </div>
          </CardContent>

          <CardFooter className="border-t border-zinc-200 bg-zinc-50/50 px-6 py-4">
            <ActionTooltip label="Guardar el mensaje promocional de la tienda">
              <Button type="submit" disabled={savingBanner} className="w-full sm:w-auto bg-black text-white hover:bg-zinc-900">
                {savingBanner ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Guardar Mensaje Promocional
                  </>
                )}
              </Button>
            </ActionTooltip>
          </CardFooter>
        </form>
      </Card>

      {/* PANEL DEL CARRUSEL PRINCIPAL */}
      <Card className="overflow-hidden rounded-md border-zinc-300 shadow-none">
        <CardHeader className="border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-700">
              <Images className="size-5" />
            </div>
            <div>
              <CardTitle>Carrusel Principal</CardTitle>
              <CardDescription>
                Administra las imágenes de campaña y textos que lucen en la portada de tu tienda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveCarousel}>
          <CardContent className="space-y-6 pt-6">
            {carouselSuccess ? (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 animate-fade-in">
                ¡Ajustes del carrusel guardados correctamente!
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-black">Activar Carrusel</Label>
                <p className="text-xs text-zinc-500">
                  Habilita o deshabilita el carrusel de imágenes completo de la portada.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={carouselEnabled}
                  onChange={(e) => setCarouselEnabled(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>

            {carouselEnabled && (
              <div className="space-y-6">
                {slides.map((slide, index) => {
                  const isFirst = index === 0;
                  return (
                    <div key={index} className="rounded-xl border border-zinc-200 p-5 bg-white space-y-4 relative">
                      {/* Botón de eliminar imagen (solo para index > 0) */}
                      {!isFirst && (
                        <ActionTooltip label="Quitar imagen del carrusel">
                          <button
                            type="button"
                            onClick={() => handleRemoveSlide(index)}
                            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-50 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </ActionTooltip>
                      )}

                      <h3 className="text-sm font-semibold text-black uppercase tracking-wider flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                          {index + 1}
                        </span>
                        Imagen para carrusel {index + 1} {isFirst && <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-normal uppercase">fija de marca</span>}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* URL o Upload de Imagen */}
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-semibold block">
                            Imagen de Campaña
                          </Label>
                          
                          {isFirst ? (
                            <div className="relative rounded-lg border border-zinc-200 bg-zinc-50 p-2 flex items-center gap-3">
                              <Image
                                src="/assets/malibu.jpg" 
                                alt="Previsualización Malibú" 
                                width={56}
                                height={56}
                                className="size-14 rounded border border-zinc-300 object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-700 font-medium">Foto corporativa fija (Malibú)</p>
                                <p className="text-[10px] text-zinc-400">Esta imagen se mantiene bloqueada para cuidar la identidad.</p>
                              </div>
                            </div>
                          ) : slide.image ? (
                            <div className="relative rounded-lg border border-zinc-200 bg-zinc-50 p-2 flex items-center gap-3">
                              <Image
                                src={slide.image} 
                                alt={`Previsualización Imagen ${index + 1}`} 
                                width={56}
                                height={56}
                                unoptimized
                                className="size-14 rounded border border-zinc-300 object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-500 truncate">{slide.image}</p>
                              </div>
                              <Label className="cursor-pointer text-xs text-black border border-zinc-200 bg-white rounded-md px-3 py-1.5 hover:bg-zinc-50 font-semibold shrink-0">
                                {uploadingIndex === index ? (
                                  <LoaderCircle className="size-3.5 animate-spin text-black" />
                                ) : (
                                  "Cambiar Foto"
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingIndex !== null}
                                  onChange={(e) => handleImageUpload(index, e)}
                                />
                              </Label>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg p-6 bg-zinc-50/50">
                              <p className="text-xs text-zinc-400 mb-3">Sube una foto directamente desde tu celular</p>
                              <Label className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-black text-white px-4 py-2 text-xs font-semibold hover:bg-zinc-900 transition-all">
                                {uploadingIndex === index ? (
                                  <LoaderCircle className="size-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="size-3.5" />
                                    Subir Foto
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingIndex !== null}
                                  onChange={(e) => handleImageUpload(index, e)}
                                />
                              </Label>
                            </div>
                          )}
                        </div>

                        {/* Subtítulo */}
                        <div className="space-y-1.5">
                          <Label htmlFor={`slide-${index}-sub`} className="text-xs font-semibold">
                            Subtítulo (Opcional)
                          </Label>
                          <Input
                            id={`slide-${index}-sub`}
                            placeholder="Ej: NUEVA TEMPORADA"
                            value={slide.subtitle}
                            onChange={(e) => handleSlideChange(index, "subtitle", e.target.value)}
                          />
                        </div>

                        {/* Título */}
                        <div className="space-y-1.5">
                          <Label htmlFor={`slide-${index}-title`} className="text-xs font-semibold">
                            Título (Opcional)
                          </Label>
                          <Input
                            id={`slide-${index}-title`}
                            placeholder="Ej: Sweaters o Básicos"
                            value={slide.title}
                            onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Botón de Agregar Imagen */}
                <ActionTooltip label="Agregar otra imagen al carrusel">
                  <Button
                    type="button"
                    onClick={handleAddSlide}
                    className="w-full py-6 border-2 border-dashed border-zinc-300 hover:border-black bg-zinc-50 hover:bg-zinc-100/50 text-zinc-600 hover:text-black flex items-center justify-center gap-2 rounded-xl transition-all shadow-none"
                  >
                    <Plus className="size-4" />
                    Agregar Imagen para Carrusel
                  </Button>
                </ActionTooltip>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-zinc-200 bg-zinc-50/50 px-6 py-4">
            <ActionTooltip label="Guardar imagenes y textos del carrusel">
              <Button type="submit" disabled={savingCarousel} className="w-full sm:w-auto bg-black text-white hover:bg-zinc-900">
                {savingCarousel ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Guardar Carrusel
                  </>
                )}
              </Button>
            </ActionTooltip>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
