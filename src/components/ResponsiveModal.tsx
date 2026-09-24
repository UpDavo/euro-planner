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
  children: ReactNode;
}

export default function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  wide = false,
  children,
}: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[1200] bg-ink/40" />
          <Drawer.Content
            className="fixed inset-x-0 bottom-0 z-[1201] flex max-h-[88vh] flex-col rounded-t-sheet bg-card shadow-float outline-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-line" />
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="sr-only">
                {description}
              </Drawer.Description>
            ) : null}
            <div className="overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
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
            "fixed left-1/2 top-1/2 z-[1201] max-h-[86vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sheet bg-card px-8 py-8 shadow-float outline-none",
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
          <Dialog.Close
            aria-label="Cerrar"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-well text-ink-soft transition-colors hover:bg-line hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <i className="ri-close-line text-lg" aria-hidden />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
