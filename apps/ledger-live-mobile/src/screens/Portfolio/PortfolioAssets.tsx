import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "~/context/Locale";
import { shallowEqual } from "react-redux";
import { useSelector, useDispatch } from "~/context/hooks";
import { GestureResponderEvent } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, IconsLegacy, Box } from "@ledgerhq/native-ui";
import { useDistribution } from "~/actions/general";
import { track, TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import {
  blacklistedTokenIdsSelector,
  discreetModeSelector,
  selectedTabPortfolioAssetsSelector,
} from "~/reducers/settings";
import { setSelectedTabPortfolioAssets } from "~/actions/settings";
import Assets from "./Assets";
import PortfolioQuickActionsBar from "./PortfolioQuickActionsBar";
import MarketBanner from "LLM/features/MarketBanner";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import useListsAnimation, { type TabListType } from "./useListsAnimation";
import TabSection, { TAB_OPTIONS } from "./TabSection";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { MarketBanner as MarketBannerFeature } from "@features/market-banner";
import { PortfolioPerpsEntryPoint } from "LLM/features/Portfolio/components";

type Props = {
  hideEmptyTokenAccount: boolean;
  openAddModal: () => void;
};

const maxItemsToDisplay = 5;

const PortfolioAssets = ({ hideEmptyTokenAccount, openAddModal }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accountListFF = useFeature("llmAccountListUI");
  const isAccountListUIEnabled = accountListFF?.enabled;
  const navigation = useNavigation();
  const allAccounts = useSelector(flattenAccountsSelector, shallowEqual);
  const initialSelectedTab = useSelector(selectedTabPortfolioAssetsSelector, shallowEqual);
  const [selectedTab, setSelectedTab] = useState<TabListType>(initialSelectedTab);
  const lastDispatchedTab = useRef<TabListType>(initialSelectedTab);

  // Sync selectedTab with Redux state when navigating back to portfolio. Only sync if initialTab
  // changed from external source (navigation), not from our own dispatch
  useEffect(() => {
    if (initialSelectedTab !== lastDispatchedTab.current) {
      setSelectedTab(initialSelectedTab);
      lastDispatchedTab.current = initialSelectedTab;
    }
  }, [initialSelectedTab]);

  const handleToggle = useCallback(
    (value: TabListType) => {
      lastDispatchedTab.current = value;
      setSelectedTab(value);
      dispatch(setSelectedTabPortfolioAssets(value));
      track("button_clicked", {
        button: value,
        page: "Wallet",
      });
    },
    [dispatch],
  );

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });
  const discreetMode = useSelector(discreetModeSelector);

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const assetsToDisplay = useMemo(
    () =>
      distribution.list
        .filter(asset => {
          return (
            asset.currency.type !== "TokenCurrency" ||
            !blacklistedTokenIdsSet.has(asset.currency.id)
          );
        })
        .slice(0, maxItemsToDisplay),
    [distribution, blacklistedTokenIdsSet],
  );

  const {
    handleButtonLayout,
    handleAccountsContentSizeChange,
    handleAssetsContentSizeChange,
    assetsFullHeight,
    accountsFullHeight,
  } = useListsAnimation(selectedTab);

  const showAssets = selectedTab === TAB_OPTIONS.Assets;

  const onPressButton = useCallback(
    (_uiEvent: GestureResponderEvent) => {
      track("button_clicked", {
        button: showAssets ? "See all assets" : "See all accounts",
        page: "Wallet",
      });
      if (!showAssets && isAccountListUIEnabled) {
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.AccountsList,
          params: {
            sourceScreenName: ScreenName.Portfolio,
            showHeader: true,
            canAddAccount: true,
            isSyncEnabled: true,
          },
        });
        return;
      }
      if (isAccountListUIEnabled) {
        navigation.navigate(NavigatorName.Assets, {
          screen: ScreenName.AssetsList,
          params: {
            sourceScreenName: ScreenName.Portfolio,
            showHeader: true,
            isSyncEnabled: true,
          },
        });
      } else {
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.Assets,
        });
      }
    },
    [showAssets, isAccountListUIEnabled, navigation],
  );

  const {
    shouldDisplayMarketBanner,
    shouldDisplayQuickActionCtas,
    isEnabled: isLwmWallet40Enabled,
  } = useWalletFeaturesConfig("mobile");

  const isLwmWallet40Disabled = !isLwmWallet40Enabled;

  return (
    <>
      <TrackScreen
        category="Wallet"
        accountsLength={distribution.list && distribution.list.length}
        discreet={discreetMode}
      />

      {shouldDisplayQuickActionCtas ? (
        <Box my={24}>
          <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
          <TransferDrawer />
        </Box>
      ) : (
        isLwmWallet40Disabled && (
          <Box my={24}>
            <PortfolioQuickActionsBar />
          </Box>
        )
      )}

      <Box>
        <PortfolioPerpsEntryPoint />
      </Box>

      <MarketBanner />

      {shouldDisplayMarketBanner && __DEV__ && (
        <Box my={24}>
          <MarketBannerFeature />
        </Box>
      )}

      {isAccountListUIEnabled ? (
        <TabSection
          handleToggle={handleToggle}
          handleButtonLayout={handleButtonLayout}
          handleAssetsContentSizeChange={handleAssetsContentSizeChange}
          handleAccountsContentSizeChange={handleAccountsContentSizeChange}
          onPressButton={onPressButton}
          initialTab={initialSelectedTab}
          showAssets={showAssets}
          assetsLength={assetsToDisplay.length}
          accountsLength={allAccounts.length}
          assetsFullHeight={assetsFullHeight}
          accountsFullHeight={accountsFullHeight}
          maxItemsToDisplay={maxItemsToDisplay}
        />
      ) : (
        <Assets assets={assetsToDisplay} />
      )}
      {!isAccountListUIEnabled && distribution.list.length < maxItemsToDisplay && (
        <Button
          type="shade"
          size="large"
          outline
          mt={6}
          iconPosition="left"
          Icon={IconsLegacy.PlusMedium}
          onPress={openAddModal}
          testID="add-account-cta"
        >
          {t("account.emptyState.addAccountCta")}
        </Button>
      )}
      {!isAccountListUIEnabled && distribution.list.length >= maxItemsToDisplay && (
        <Button type="shade" size="large" outline onPress={onPressButton}>
          {t("portfolio.seeAllAssets")}
        </Button>
      )}
    </>
  );
};

export default React.memo(PortfolioAssets);
