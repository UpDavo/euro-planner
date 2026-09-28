import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Un bloque gris que late mientras llega el contenido de verdad. */
export default function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-well motion-reduce:animate-none", className)}
      style={style}
      aria-hidden
    />
  );
}
