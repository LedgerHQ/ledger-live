import { useCallback, useMemo } from "react";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { GeneralSettingsData } from "@features/flow-settings-general";
import { useDispatch, useSelector } from "~/context/hooks";
import { setLedgerSyncActivateDrawer } from "~/actions/walletSync";
import { NavigatorName, ScreenName } from "~/const";
import { navigationRef } from "~/rootnavigation";

/** Opens the Ledger Sync management screen once activated, the activation drawer otherwise. */
export function useLedgerSync(): GeneralSettingsData["ledgerSync"] {
  const dispatch = useDispatch();
  const trustchain = useSelector(trustchainSelector);
  const isActive = Boolean(trustchain?.rootId);

  const open = useCallback(() => {
    if (isActive) {
      navigationRef.current?.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncActivated,
      });
      return;
    }
    dispatch(setLedgerSyncActivateDrawer(true));
  }, [isActive, dispatch]);

  return useMemo(() => ({ isActive, open }), [isActive, open]);
}
