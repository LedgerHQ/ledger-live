import { useCallback, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useReadOnlyCoins } from "~/hooks/useReadOnlyCoins";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { Asset } from "~/types/asset";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";

const MAX_ASSETS_TO_DISPLAY = 5;

interface UsePortfolioEmptySectionViewModelResult {
  hasAccounts: boolean;
  assets: Asset[];
  isAddModalOpened: boolean;
  goToAssets: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;
}

export const usePortfolioEmptySectionViewModel = (): UsePortfolioEmptySectionViewModelResult => {
  const nav = useNavigation();
  const hasAccounts = useSelector(state => flattenAccountsSelector(state).length > 0);
  const { sortedCryptoCurrencies } = useReadOnlyCoins({ maxDisplayed: MAX_ASSETS_TO_DISPLAY });
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const accountListFF = useFeature("llmAccountListUI");
  const isAccountListUIEnabled = accountListFF?.enabled ?? false;

  const assets: Asset[] = useMemo(
    () =>
      sortedCryptoCurrencies?.map(currency => ({
        amount: 0,
        accounts: [],
        currency,
      })),
    [sortedCryptoCurrencies],
  );

  const goToAssets = useCallback(() => {
    if (isAccountListUIEnabled) {
      nav.navigate(NavigatorName.Assets, {
        screen: ScreenName.AssetsList,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          showHeader: true,
          isSyncEnabled: true,
        },
      });
    } else {
      nav.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    }
  }, [nav, isAccountListUIEnabled]);

  const openAddModal = useCallback(() => {
    track("button_clicked", {
      button: "Add Account",
    });
    setAddModalOpened(true);
  }, []);

  const closeAddModal = useCallback(() => setAddModalOpened(false), []);

  return {
    hasAccounts,
    assets,
    isAddModalOpened,
    goToAssets,
    openAddModal,
    closeAddModal,
  };
};
