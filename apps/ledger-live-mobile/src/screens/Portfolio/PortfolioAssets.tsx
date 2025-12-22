import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";
import { useSelector, useDispatch } from "~/context/store";
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
import { setSelectedTabPortfolioAssets } from "~/actions/settings";
import PortfolioQuickActionsBar from "./PortfolioQuickActionsBar";
import useListsAnimation, { type TabListType } from "./useListsAnimation";
import TabSection, { TAB_OPTIONS } from "./TabSection";
import { flattenAccountsSelector } from "~/reducers/accounts";

type Props = {
  hideEmptyTokenAccount: boolean;
};

const maxItemsToDisplay = 5;

const PortfolioAssets = ({ hideEmptyTokenAccount }: Props) => {
  const dispatch = useDispatch();
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
    </>
  );
};

export default React.memo(PortfolioAssets);
