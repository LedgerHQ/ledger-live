import { useSyncExternalStore } from "react";
import type { MessageMap, Transport, TransportState } from "@devtools/transport";

export function useTransportState<M extends MessageMap>(
  transport: Transport<M>,
): TransportState<M> {
  return useSyncExternalStore(transport.subscribe, transport.getState, transport.getState);
}
