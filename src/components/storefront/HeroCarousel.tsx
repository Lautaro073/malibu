"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  image: string;
  subtitle?: string;
  title?: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    image: "/assets/malibu.jpg",
    subtitle: "NUEVA TEMPORADA",
    title: "Malibú",
  },
];

interface HeroCarouselProps {
  initialSlides?: Slide[];
  initialEnabled?: boolean;
}

export function HeroCarousel({ initialSlides = DEFAULT_SLIDES, initialEnabled = true }: HeroCarouselProps) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides.length > 0 ? initialSlides : DEFAULT_SLIDES);
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Mantener sincronizado si cambian las props del servidor
  const [prevInitialSlides, setPrevInitialSlides] = useState(initialSlides);
  const [prevInitialEnabled, setPrevInitialEnabled] = useState(initialEnabled);
  if (initialSlides !== prevInitialSlides || initialEnabled !== prevInitialEnabled) {
    setPrevInitialSlides(initialSlides);
    setPrevInitialEnabled(initialEnabled);
    setSlides(initialSlides.length > 0 ? initialSlides : DEFAULT_SLIDES);
    setEnabled(initialEnabled);
  }

  // Auto-play cada 2,8 segundos
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 2800);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Deslizamiento táctil para móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // mínimo de píxeles para deslizar
    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!enabled || slides.length === 0) {
    return null;
  }

  return (
    <section
      className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[60vh] bg-zinc-900 overflow-hidden border-b border-zinc-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Contenedor del Slider */}
      <div className="relative w-full h-full flex">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const hasText = slide.subtitle?.trim() || slide.title?.trim();
          return (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-out flex items-center justify-center ${isActive
                  ? "opacity-100 translate-x-0 pointer-events-auto z-10"
                  : "opacity-0 translate-x-full pointer-events-none z-0"
                }`}
            >
              {/* Imagen de fondo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out scale-105"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  transform: isActive ? "scale(1)" : "scale(1.05)"
                }}
              />

              {/* Overlay oscuro para legibilidad superior (solo si tiene texto) */}
              {hasText ? (
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-black/30" />
              ) : null}

              {/* Contenido del Slide */}
              {hasText ? (
                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
                  {slide.subtitle?.trim() && (
                    <span className="text-white text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase mb-3 animate-fade-in opacity-90">
                      {slide.subtitle}
                    </span>
                  )}
                  {slide.title?.trim() && (
                    <h1 className="text-white text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight uppercase leading-tight">
                      {slide.title}
                    </h1>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Flechas de navegación (ocultas en móvil, visibles on hover en desktop) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 hidden md:flex items-center justify-center rounded-full bg-black/25 backdrop-blur-sm text-white border border-white/10 hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 hidden md:flex items-center justify-center rounded-full bg-black/25 backdrop-blur-sm text-white border border-white/10 hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores de puntos (Dots) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                    ? "w-7 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
