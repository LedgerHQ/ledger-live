/**
 * Lazy-loaded layer that pulls in the bridge (all coin implementations) and the
 * renderer families barrel. By loading this chunk only when the main app shell
 * mounts, we avoid loading coins/families at init (see jest-perf.md § Costly import tree).
 * SyncNewAccounts must live here (not in Default) so it doesn't statically import the bridge.
 */
import React from "react";
import "~/renderer/families";
import { BridgeSyncProvider } from "~/renderer/bridge/BridgeSyncContext";
import { SyncNewAccounts } from "~/renderer/bridge/SyncNewAccounts";

type Props = { children: React.ReactNode };

export default function BridgeAndFamiliesLayer({ children }: Props) {
  return (
    <BridgeSyncProvider>
      <SyncNewAccounts priority={2} />
      {children}
    </BridgeSyncProvider>
  );
}
