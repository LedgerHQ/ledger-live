import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { shallowEqual, useSelector } from "react-redux";
import { useStartProfiler } from "@shopify/react-native-performance";
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
import Assets from "./Assets";
import PortfolioQuickActionsBar from "./PortfolioQuickActionsBar";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import useListsAnimation from "./useListsAnimation";
import TabSection, { TAB_OPTIONS } from "./TabSection";
import { accountsSelector } from "~/reducers/accounts";

type Props = {
  hideEmptyTokenAccount: boolean;
  openAddModal: () => void;
};

const maxItemsToDysplay = 5;

const PortfolioAssets = ({ hideEmptyTokenAccount, openAddModal }: Props) => {
  const { t } = useTranslation();
  const accountListFF = useFeature("llmAccountListUI");
  const isAccountListUIEnabled = accountListFF?.enabled;
  const navigation = useNavigation();
  const allAccounts = useSelector(accountsSelector, shallowEqual);
  const initialSelectedTab = useSelector(selectedTabPortfolioAssetsSelector, shallowEqual);

  const startNavigationTTITimer = useStartProfiler();
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
        .slice(0, maxItemsToDysplay),
    [distribution, blacklistedTokenIdsSet],
  );

  const {
    handleToggle,
    handleLayout,
    handleButtonLayout,
    handleAccountsContentSizeChange,
    handleAssetsContentSizeChange,
    selectedTab,
    assetsAnimatedStyle,
    containerHeight,
    accountsAnimatedStyle,
  } = useListsAnimation(initialSelectedTab);

  const showAssets = selectedTab === TAB_OPTIONS.Assets;
  const showAccounts = selectedTab === TAB_OPTIONS.Accounts;

  const onPressButton = useCallback(
    (uiEvent: GestureResponderEvent) => {
      startNavigationTTITimer({ source: ScreenName.Portfolio, uiEvent });
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
    [startNavigationTTITimer, showAssets, isAccountListUIEnabled, navigation],
  );

  return (
    <>
      <TrackScreen
        category="Wallet"
        accountsLength={distribution.list && distribution.list.length}
        discreet={discreetMode}
      />
      <Box my={24}>
        <PortfolioQuickActionsBar />
      </Box>
      {isAccountListUIEnabled ? (
        <TabSection
          t={t}
          handleToggle={handleToggle}
          handleLayout={handleLayout}
          handleButtonLayout={handleButtonLayout}
          handleAssetsContentSizeChange={handleAssetsContentSizeChange}
          handleAccountsContentSizeChange={handleAccountsContentSizeChange}
          onPressButton={onPressButton}
          initialTab={initialSelectedTab}
          showAssets={showAssets}
          showAccounts={showAccounts}
          assetsLength={assetsToDisplay.length}
          accountsLength={allAccounts.length}
          assetsAnimatedStyle={assetsAnimatedStyle}
          accountsAnimatedStyle={accountsAnimatedStyle}
          maxItemsToDysplay={maxItemsToDysplay}
          containerHeight={containerHeight}
        />
      ) : (
        <Assets assets={assetsToDisplay} />
      )}
      {!isAccountListUIEnabled && distribution.list.length < maxItemsToDysplay && (
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
      {!isAccountListUIEnabled && distribution.list.length >= maxItemsToDysplay && (
        <Button type="shade" size="large" outline onPress={onPressButton}>
          {t("portfolio.seeAllAssets")}
        </Button>
      )}
    </>
  );
};

export default React.memo(PortfolioAssets);
