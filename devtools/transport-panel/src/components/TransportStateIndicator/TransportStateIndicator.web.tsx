import type { MessageMap, ConnectionStatus, TransportState } from "@devtools/transport";
import { cn } from "@ledgerhq/lumen-utils-shared";

export interface TransportStateIndicatorProps<M extends MessageMap> {
  readonly transportState: TransportState<M>;
}

const STATUS_COLOR: Record<ConnectionStatus, { pill: string; dot: string }> = {
  idle: { pill: "text-muted bg-muted", dot: "bg-muted-strong" },
  connecting: { pill: "text-warning bg-warning-transparent", dot: "bg-warning-strong" },
  open: { pill: "text-success bg-success-transparent", dot: "bg-success-strong" },
  closed: { pill: "text-disabled bg-disabled", dot: "bg-disabled-strong" },
  error: { pill: "text-error bg-error-transparent", dot: "bg-error-strong" },
};

export function TransportStateIndicator<M extends MessageMap>({
  transportState,
}: TransportStateIndicatorProps<M>) {
  const status = transportState.status;
  const { pill, dot } = STATUS_COLOR[status];

  return (
    <div className={cn(`flex items-center rounded-full px-8 py-2`, pill)}>
      <span className={cn(`size-10 rounded-full`, dot)} />
      <span className={cn(`body-3 ml-8  px-4 py-2`)}>{status}</span>
    </div>
  );
}
