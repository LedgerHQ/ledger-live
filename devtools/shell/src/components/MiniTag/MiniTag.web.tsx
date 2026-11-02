type MiniTagProps = Readonly<{ label: string; className?: string }>;

export function MiniTag({ label, className = "bg-muted text-muted" }: MiniTagProps) {
  return (
    <span
      className={`inline-block shrink-0 rounded-xs px-4 align-middle body-4-semi-bold ${className}`}
    >
      {label}
    </span>
  );
}
