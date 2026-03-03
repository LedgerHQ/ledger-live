import { useCallback, useState } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "~/analytics";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";

interface UsePortfolioEmptySectionViewModelResult {
  hasAccounts: boolean;
  shouldDisplayAssetSection: boolean;
  isAddModalOpened: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
}

export const usePortfolioEmptySectionViewModel = (): UsePortfolioEmptySectionViewModelResult => {
  const hasAccounts = useSelector(state => flattenAccountsSelector(state).length > 0);
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("mobile");
  const [isAddModalOpened, setAddModalOpened] = useState(false);

  const openAddModal = useCallback(() => {
    track("button_clicked", {
      button: "Add Account",
    });
    setAddModalOpened(true);
  }, []);

  const closeAddModal = useCallback(() => setAddModalOpened(false), []);

  return {
    hasAccounts,
    shouldDisplayAssetSection,
    isAddModalOpened,
    openAddModal,
    closeAddModal,
  };
};
