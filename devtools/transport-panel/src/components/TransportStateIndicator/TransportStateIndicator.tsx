import type { MessageMap, ConnectionStatus, TransportState } from "@devtools/transport";
import { cn } from "@ledgerhq/lumen-utils-shared";

export interface TransportStateIndicatorProps<M extends MessageMap> {
  readonly transportState: TransportState<M>;
}

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  idle: "text-muted bg-muted",
  connecting: "text-warning bg-warning",
  open: "text-success bg-success",
  closed: "text-disabled bg-disabled",
  error: "text-error bg-error",
};

export function TransportStateIndicator<M extends MessageMap>({
  transportState,
}: TransportStateIndicatorProps<M>) {
  const status = transportState.status;
  const color = STATUS_COLOR[status];

  return (
    <div className={cn(`flex items-center rounded-full px-8 py-2`, color)}>
      <span className={cn(`size-10 rounded-full`, `${color}-strong`)} />
      <span className={cn(`body-3 ml-8  px-4 py-2`)}>{status}</span>
    </div>
  );
}
