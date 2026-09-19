/**
 * The lifecycle observer runs outside React, so it cannot use `useFeature`. Reading LiveConfig
 * directly would miss the local overrides the Redux slice resolves, letting the dApp hook and
 * this observer disagree about the kill-switch. Boot injects the same slice reader both use.
 */
type EarnTxLifecycleFlagReader = () => boolean;

let readEnabled: EarnTxLifecycleFlagReader | null = null;

export function setEarnTxLifecycleFlagReader(reader: EarnTxLifecycleFlagReader | null): void {
  readEnabled = reader;
}

export function isEarnTxLifecycleMonitoringEnabled(): boolean {
  return readEnabled?.() ?? false;
}
