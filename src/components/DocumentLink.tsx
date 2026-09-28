import type { TripDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindIcon: Record<TripDocument["kind"], string> = {
  flight: "ri-plane-line",
  train: "ri-train-line",
};

/** Un billete (PDF o captura): se abre en otra pestaña para enseñarlo o guardarlo. */
export default function DocumentLink({
  doc,
  label,
  className,
}: {
  doc: TripDocument;
  /** Texto principal. Por defecto, el título del documento. */
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={doc.file}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-2xl bg-well px-3 py-2.5 text-left transition-colors hover:bg-accent-soft",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        className,
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-accent-ink"
        aria-hidden
      >
        <i className={cn(kindIcon[doc.kind], "text-[15px]")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-ink">
          {label ?? doc.title}
        </span>
        <span className="block truncate text-[12px] text-ink-mute">
          {doc.detail}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-ink-soft">
        {doc.format === "pdf" ? "PDF" : "Imagen"}
        <i className="ri-external-link-line text-[13px]" aria-hidden />
      </span>
    </a>
  );
}
