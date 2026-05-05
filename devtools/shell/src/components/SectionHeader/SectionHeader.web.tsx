import type { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";

interface SectionHeaderProps {
  icon: typeof ChevronRight;
  label: string;
}

export function SectionHeader({ icon: Icon, label }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-8 mb-12">
      <Icon size={16} className="text-muted" />
      <span className="body-3 font-semibold uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}
