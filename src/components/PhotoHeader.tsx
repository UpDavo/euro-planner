import type { Photo } from "@/lib/types";

/** Foto de la parada con el crédito que pide la licencia de Commons. */
export default function PhotoHeader({ photo, alt }: { photo: Photo; alt: string }) {
  return (
    <figure className="mt-4">
      {/* Miniatura ya servida a 960px por Wikimedia: no hace falta next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={alt}
        loading="lazy"
        className="aspect-[16/10] w-full rounded-2xl bg-well object-cover"
      />
      <figcaption className="mt-1.5 truncate text-[11px] text-ink-mute">
        <a
          href={photo.page}
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink-soft hover:underline"
        >
          Foto: {photo.credit || "Wikimedia Commons"}
        </a>
      </figcaption>
    </figure>
  );
}
