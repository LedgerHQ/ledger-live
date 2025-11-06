import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { shallowEqual, useSelector } from "react-redux";

import { GestureResponderEvent } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Box } from "@ledgerhq/native-ui";
import { useDistribution } from "~/actions/general";
import { track, TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import {
  blacklistedTokenIdsSelector,
  discreetModeSelector,
  selectedTabPortfolioAssetsSelector,
} from "~/reducers/settings";
import PortfolioQuickActionsBar from "./PortfolioQuickActionsBar";
import useListsAnimation from "./useListsAnimation";
import TabSection, { TAB_OPTIONS } from "./TabSection";
import { flattenAccountsSelector } from "~/reducers/accounts";

type Props = {
  hideEmptyTokenAccount: boolean;
};

const maxItemsToDysplay = 5;

const PortfolioAssets = ({ hideEmptyTokenAccount }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const allAccounts = useSelector(flattenAccountsSelector, shallowEqual);
  const initialSelectedTab = useSelector(selectedTabPortfolioAssetsSelector, shallowEqual);

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
    (_uiEvent: GestureResponderEvent) => {
      track("button_clicked", {
        button: showAssets ? "See all assets" : "See all accounts",
        page: "Wallet",
      });
      if (!showAssets) {
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
      navigation.navigate(NavigatorName.Assets, {
        screen: ScreenName.AssetsList,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          showHeader: true,
          isSyncEnabled: true,
        },
      });
    },
    [showAssets, navigation],
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
    </>
  );
};

export default React.memo(PortfolioAssets);
