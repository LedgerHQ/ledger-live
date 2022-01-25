import React, { useContext } from "react";
import type { BridgeSyncState, Sync } from "./types";
export const BridgeSyncContext: React.Context<Sync> = React.createContext(
  (_) => {}
);
export const BridgeSyncStateContext: React.Context<BridgeSyncState> =
  React.createContext({});
export const useBridgeSync = (): Sync => useContext(BridgeSyncContext);
export const useBridgeSyncState = (): BridgeSyncState =>
  useContext(BridgeSyncStateContext);
