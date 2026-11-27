import { useCallback, useMemo } from "react";
import {
  applyAssetManagementUpdate,
  type AssetManagementSettingsPort,
  type AssetManagementSettingsValues,
  type AssetManagementSideEffects,
  type AssetManagementUpdate,
} from "@features/flow-settings-asset-management";
import {
  setFilterTokenOperationsZeroAmount,
  setHideEmptyTokenAccounts,
  showToken as showTokenAction,
} from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  filterTokenOperationsZeroAmountEnabledSelector,
  hideEmptyTokenAccountsEnabledSelector,
} from "~/reducers/settings";
import { useHiddenTokenGroups } from "./useHiddenTokenGroups";

const keepAccountsAsTheyAre = () => undefined;

/**
 * The Asset management section's part of the settings port: the legacy toggles, whose env
 * `SetEnvsFromSettings` keeps in sync, and the hidden tokens. Closing their list runs no sync,
 * as on the legacy mobile screen.
 */
export function useAssetManagementSettingsAdapter(): AssetManagementSettingsPort {
  const dispatch = useDispatch();
  const hideEmptyTokenAccounts = useSelector(hideEmptyTokenAccountsEnabledSelector);
  const filterTokenOperationsZeroAmount = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );
  const hiddenTokens = useHiddenTokenGroups();

  const values = useMemo<AssetManagementSettingsValues>(
    () => ({ hideEmptyTokenAccounts, filterTokenOperationsZeroAmount }),
    [hideEmptyTokenAccounts, filterTokenOperationsZeroAmount],
  );

  const effects = useMemo<AssetManagementSideEffects>(
    () => ({
      setHideEmptyTokenAccounts: value => dispatch(setHideEmptyTokenAccounts(value)),
      setFilterTokenOperationsZeroAmount: value =>
        dispatch(setFilterTokenOperationsZeroAmount(value)),
    }),
    [dispatch],
  );

  const setValue = useCallback(
    (update: AssetManagementUpdate) => applyAssetManagementUpdate(effects, update),
    [effects],
  );

  const showToken = useCallback(
    (tokenId: string) => dispatch(showTokenAction(tokenId)),
    [dispatch],
  );

  return useMemo(
    () => ({
      values,
      setValue,
      hiddenTokens,
      showToken,
      onHiddenTokensClosed: keepAccountsAsTheyAre,
    }),
    [values, setValue, hiddenTokens, showToken],
  );
}
