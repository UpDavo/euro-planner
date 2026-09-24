import { cn } from "@/lib/utils";

/** Si la parada exige comprar la entrada antes de llegar. */
export default function TicketBadge({
  required,
  className,
}: {
  required: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        required ? "bg-accent-solid text-white" : "bg-well text-ink-mute",
        className,
      )}
    >
      <i
        className={cn(
          required ? "ri-ticket-2-fill" : "ri-ticket-2-line",
          "text-[12px]",
        )}
        aria-hidden
      />
      {required ? "Ticket previo" : "Sin ticket previo"}
    </span>
  );
}
