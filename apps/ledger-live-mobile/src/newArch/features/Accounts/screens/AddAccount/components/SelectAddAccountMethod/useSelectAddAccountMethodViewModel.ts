import { useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useCallback } from "react";
import { track } from "~/analytics";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerController } from "LLM/features/ModularDrawer";

type AddAccountMethodViewModelProps = {
  currency?: CryptoCurrency | TokenCurrency | null;
  onShowWalletSyncDrawer?: () => void;
  onCloseAddAccountDrawer?: () => void;
};

const useSelectAddAccountMethodViewModel = ({
  currency,
  onShowWalletSyncDrawer,
  onCloseAddAccountDrawer,
}: AddAccountMethodViewModelProps) => {
  const walletSyncFeatureFlag = useFeature("llmWalletSync");
  const isReadOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const isWalletSyncEnabled = walletSyncFeatureFlag?.enabled;

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const handleWalletSync = useCallback(() => {
    trackButtonClick("Account Use Ledger Sync");
    onShowWalletSyncDrawer?.();
  }, [trackButtonClick, onShowWalletSyncDrawer]);

  const { openDrawer } = useModularDrawerController();

  const handleOpenModularDrawer = useCallback(() => {
    const currenciesToUse = currency ? [currency.id] : undefined;
    return openDrawer({
      currencies: currenciesToUse,
      areCurrenciesFiltered: currenciesToUse?.length === 1 ? true : false,
      enableAccountSelection: false,
      flow: "add_account",
      source: "add_account_button",
    });
  }, [currency, openDrawer]);

  const handleAddAccount = useCallback(() => {
    trackButtonClick("With your Ledger");

    onCloseAddAccountDrawer?.();

    handleOpenModularDrawer();
  }, [trackButtonClick, onCloseAddAccountDrawer, handleOpenModularDrawer]);

  return {
    isWalletSyncEnabled,
    isReadOnlyModeEnabled,
    handleAddAccount,
    handleWalletSync,
  };
};

export default useSelectAddAccountMethodViewModel;
