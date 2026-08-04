import { useSyncExternalStore } from "react";
import { buildTransport, buildCopyStoreProtocol, combineProtocols } from "@devtools/wire";
import { store } from "~/state-manager/configureStore";
import { sleepingListener } from "~/state-manager/sleepingListener";

const HUB_URL = "ws://127.0.0.1:9090";
const ROLE = "host" as const;

function buildRelay() {
  return buildTransport(
    { hubUrl: HUB_URL, role: ROLE, id: "lwm" },
    combineProtocols(buildCopyStoreProtocol(store, sleepingListener, ROLE)),
  );
}

let relay: ReturnType<typeof buildRelay> | undefined;

export function useDevToolsRelay() {
  if (!relay) relay = buildRelay();
  const wireState = useSyncExternalStore(relay.subscribe, relay.getState, relay.getState);
  return { wire: relay, wireState };
}
