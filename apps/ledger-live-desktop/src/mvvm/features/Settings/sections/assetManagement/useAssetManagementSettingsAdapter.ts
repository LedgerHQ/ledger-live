import { useCallback, useMemo } from "react";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import {
  applyAssetManagementUpdate,
  type AssetManagementSettingsPort,
  type AssetManagementSettingsValues,
  type AssetManagementSideEffects,
  type AssetManagementUpdate,
} from "@features/flow-settings-asset-management";
import { useDispatch } from "LLD/hooks/redux";
import {
  showToken as showTokenAction,
  useFilterTokenOperationsZeroAmount,
  useHideEmptyTokenAccounts,
} from "~/renderer/actions/settings";
import { useHiddenTokenGroups } from "./useHiddenTokenGroups";

/**
 * The Asset management section's part of the settings port: the legacy toggles with their env
 * and accounts ordering updates, and the hidden tokens, which resync the accounts once closed.
 */
export function useAssetManagementSettingsAdapter(): AssetManagementSettingsPort {
  const dispatch = useDispatch();
  const sync = useBridgeSync();
  const [hideEmptyTokenAccounts, setHideEmptyTokenAccounts] = useHideEmptyTokenAccounts();
  const [filterTokenOperationsZeroAmount, setFilterTokenOperationsZeroAmount] =
    useFilterTokenOperationsZeroAmount();
  const hiddenTokens = useHiddenTokenGroups();

  const values = useMemo<AssetManagementSettingsValues>(
    () => ({ hideEmptyTokenAccounts, filterTokenOperationsZeroAmount }),
    [hideEmptyTokenAccounts, filterTokenOperationsZeroAmount],
  );

  const effects = useMemo<AssetManagementSideEffects>(
    () => ({ setHideEmptyTokenAccounts, setFilterTokenOperationsZeroAmount }),
    [setHideEmptyTokenAccounts, setFilterTokenOperationsZeroAmount],
  );

  const setValue = useCallback(
    (update: AssetManagementUpdate) => applyAssetManagementUpdate(effects, update),
    [effects],
  );

  const showToken = useCallback(
    (tokenId: string) => dispatch(showTokenAction(tokenId)),
    [dispatch],
  );

  const onHiddenTokensClosed = useCallback(
    () => sync({ type: "SYNC_ALL_ACCOUNTS", priority: 5, reason: "tokens-ignore-list-change" }),
    [sync],
  );

  return useMemo(
    () => ({ values, setValue, hiddenTokens, showToken, onHiddenTokensClosed }),
    [values, setValue, hiddenTokens, showToken, onHiddenTokensClosed],
  );
}
