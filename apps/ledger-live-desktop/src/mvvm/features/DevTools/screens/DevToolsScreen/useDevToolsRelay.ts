import { useSyncExternalStore } from "react";
import { buildTransport, buildCopyStoreProtocol, combineProtocols } from "@devtools/wire";
import { sleepingListener } from "~/state-manager/sleepingListener";
import { useStore } from "LLD/hooks/redux";

const HUB_URL = "ws://127.0.0.1:9090";
const ROLE = "host" as const;

function buildRelay(store: ReturnType<typeof useStore>) {
  return buildTransport(
    { hubUrl: HUB_URL, role: ROLE, id: "lld" },
    combineProtocols(buildCopyStoreProtocol(store, sleepingListener, ROLE)),
  );
}

let relay: ReturnType<typeof buildRelay> | undefined;

export function useDevToolsRelay() {
  const store = useStore();
  if (!relay) relay = buildRelay(store);
  const wireState = useSyncExternalStore(relay.subscribe, relay.getState, relay.getState);
  return { wire: relay, wireState };
}
