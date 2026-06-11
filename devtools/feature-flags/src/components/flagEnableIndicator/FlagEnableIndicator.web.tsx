import { Pill } from "../pill/Pill";
import { cn } from "@ledgerhq/lumen-utils-shared";

export interface FlagEnableIndicatorProps {
  readonly enabled: boolean;
}

export function FlagEnableIndicator({ enabled }: FlagEnableIndicatorProps) {
  const dotColor = enabled ? "bg-success-strong" : "bg-muted-strong";
  return (
    <Pill variant={enabled ? "success" : "muted"} size={3}>
      <div className="flex items-center gap-4">
        <span className={cn(`size-6 rounded-full ${dotColor}`)} />
        {enabled ? "On" : "Off"}
      </div>
    </Pill>
  );
}
