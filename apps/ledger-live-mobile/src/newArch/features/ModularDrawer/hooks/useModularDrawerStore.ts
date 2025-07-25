import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { State } from "~/reducers/types";
import {
  openModularDrawer,
  closeModularDrawer,
  setPreselectedCurrencies,
  setOnAccountSelected,
  setEnableAccountSelection,
  setAccounts$,
} from "~/reducers/modularDrawer";

export const useModularDrawerStore = () => {
  const dispatch = useDispatch();
  const { isOpen, preselectedCurrencies, onAccountSelected, enableAccountSelection, accounts$ } =
    useSelector((state: State) => state.modularDrawer);

  const openDrawer = useCallback(
    (params?: {
      currencies?: CryptoOrTokenCurrency[];
      onAccountSelected?: (account: Account) => void;
      enableAccountSelection?: boolean;
      accounts$?: Observable<WalletAPIAccount[]>;
    }) => {
      dispatch(openModularDrawer(params || {}));
    },
    [dispatch],
  );

  const closeDrawer = useCallback(() => {
    dispatch(closeModularDrawer());
  }, [dispatch]);

  const updatePreselectedCurrencies = useCallback(
    (currencies: CryptoOrTokenCurrency[]) => {
      dispatch(setPreselectedCurrencies(currencies));
    },
    [dispatch],
  );

  const updateOnAccountSelected = useCallback(
    (callback: ((account: Account) => void) | undefined) => {
      dispatch(setOnAccountSelected(callback));
    },
    [dispatch],
  );

  const updateEnableAccountSelection = useCallback(
    (enable: boolean) => {
      dispatch(setEnableAccountSelection(enable));
    },
    [dispatch],
  );

  const updateAccounts$ = useCallback(
    (accounts$: Observable<WalletAPIAccount[]> | undefined) => {
      dispatch(setAccounts$(accounts$));
    },
    [dispatch],
  );

  return {
    isOpen,
    preselectedCurrencies,
    onAccountSelected,
    enableAccountSelection,
    accounts$,
    openDrawer,
    closeDrawer,
    updatePreselectedCurrencies,
    updateOnAccountSelected,
    updateEnableAccountSelection,
    updateAccounts$,
  };
};
