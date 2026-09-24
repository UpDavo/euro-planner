"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** El calendario del viaje necesita más ancho que una ficha de parada. */
  wide?: boolean;
  /** Flechas de carrusel a los lados. Sin callback, esa flecha no aparece. */
  onPrev?: () => void;
  onNext?: () => void;
  children: ReactNode;
}

const arrowClass =
  "flex h-12 w-12 items-center justify-center rounded-full bg-card text-ink shadow-float transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function Arrow({
  dir,
  onClick,
  className,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Parada anterior" : "Parada siguiente"}
      className={cn(arrowClass, className)}
    >
      <i
        className={cn(
          dir === "prev" ? "ri-arrow-left-s-line" : "ri-arrow-right-s-line",
          "text-2xl",
        )}
        aria-hidden
      />
    </button>
  );
}

export default function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  wide = false,
  onPrev,
  onNext,
  children,
}: Props) {
  const isMobile = useIsMobile();

  // ← → del teclado recorren el carrusel mientras el modal está abierto.
  useEffect(() => {
    if (!open || (!onPrev && !onNext)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onPrev, onNext]);

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[1200] bg-ink/40" />
          <Drawer.Content
            className="fixed inset-x-0 bottom-0 z-[1201] flex max-h-[88vh] flex-col rounded-t-sheet bg-card shadow-float outline-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {onPrev ? (
              <Arrow dir="prev" onClick={onPrev} className="absolute -top-16 left-4" />
            ) : null}
            {onNext ? (
              <Arrow dir="next" onClick={onNext} className="absolute -top-16 right-4" />
            ) : null}
            <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-line" />
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="sr-only">
                {description}
              </Drawer.Description>
            ) : null}
            <div data-modal-scroll className="overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1200] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[1201] -translate-x-1/2 -translate-y-1/2 outline-none",
            wide
              ? "w-[min(46rem,calc(100vw-3rem))]"
              : "w-[min(30rem,calc(100vw-3rem))]",
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="sr-only">
              {description}
            </Dialog.Description>
          ) : null}
          {onPrev ? (
            <Arrow
              dir="prev"
              onClick={onPrev}
              className="absolute -left-[4.5rem] top-1/2 -translate-y-1/2"
            />
          ) : null}
          {onNext ? (
            <Arrow
              dir="next"
              onClick={onNext}
              className="absolute -right-[4.5rem] top-1/2 -translate-y-1/2"
            />
          ) : null}
          <div data-modal-scroll className="relative max-h-[86vh] overflow-y-auto rounded-sheet bg-card px-8 py-8 shadow-float">
            <Dialog.Close
              aria-label="Cerrar"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-well text-ink-soft transition-colors hover:bg-line hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <i className="ri-close-line text-lg" aria-hidden />
            </Dialog.Close>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
