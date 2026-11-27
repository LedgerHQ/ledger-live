import { useCallback, useMemo } from "react";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { GeneralSettingsData } from "@features/flow-settings-general";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import { useEntryPoint } from "LLD/features/LedgerSyncEntryPoints/hooks/useEntryPoint";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import { walletSyncFakedSelector } from "~/renderer/reducers/walletSync";

/** Opens the Ledger Sync activation drawer, or the Ledger Sync drawer once activated. */
export function useLedgerSync(): GeneralSettingsData["ledgerSync"] {
  const dispatch = useDispatch();
  const trustchain = useSelector(trustchainSelector);
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const { shouldDisplayEntryPoint } = useEntryPoint(EntryPoint.settings);
  const { goToWelcomeScreenWalletSync } = useFlows();
  const { openDrawer: openActivationDrawer } = useActivationDrawer();

  const open = useCallback(() => {
    if (shouldDisplayEntryPoint) {
      openActivationDrawer();
      return;
    }
    if (!hasBeenFaked) goToWelcomeScreenWalletSync();
    dispatch(setDrawerVisibility(true));
  }, [
    shouldDisplayEntryPoint,
    openActivationDrawer,
    hasBeenFaked,
    goToWelcomeScreenWalletSync,
    dispatch,
  ]);

  return useMemo(
    () => ({ isActive: Boolean(trustchain?.rootId), open }),
    [trustchain?.rootId, open],
  );
}
