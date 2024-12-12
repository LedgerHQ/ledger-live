import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useStartProfiler } from "@shopify/react-native-performance";
import { GestureResponderEvent } from "react-native";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { Button, IconsLegacy, Box, Flex, TabSelector } from "@ledgerhq/native-ui";
import { useDistribution } from "~/actions/general";
import { track, TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { blacklistedTokenIdsSelector, discreetModeSelector } from "~/reducers/settings";
import Assets from "./Assets";
import PortfolioQuickActionsBar from "./PortfolioQuickActionsBar";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AccountsListView from "LLM/features/Accounts/components/AccountsListView";
import AssetsListView from "LLM/features/Assets/components/AssetsListView";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";
import useListsAnimation from "./useListsAnimation";

type Props = {
  hideEmptyTokenAccount: boolean;
  openAddModal: () => void;
};

export const TAB_OPTIONS = {
  Assets: "Assets",
  Accounts: "Accounts",
} as const;

const maxAssetsToDisplay = 5;

const PortfolioAssets = ({ hideEmptyTokenAccount, openAddModal }: Props) => {
  const { t } = useTranslation();
  const accountListFF = useFeature("llmAccountListUI");
  const isAccountListUIEnabled = accountListFF?.enabled;
  const navigation = useNavigation();
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
        .slice(0, maxAssetsToDisplay),
    [distribution, blacklistedTokenIdsSet],
  );

  const { selectedTab, handleToggle, handleLayout, assetsAnimatedStyle, accountsAnimatedStyle } =
    useListsAnimation(TAB_OPTIONS.Assets);

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
        navigation.navigate(ScreenName.AssetsList, {
          sourceScreenName: ScreenName.Portfolio,
          showHeader: true,
          isSyncEnabled: true,
        });
      } else {
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.Assets,
        });
      }
    },
    [startNavigationTTITimer, showAssets, isAccountListUIEnabled, navigation],
  );

  const showAddAccountButton =
    isAccountListUIEnabled && showAccounts && distribution.list.length >= maxAssetsToDisplay;

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
        <>
          <Box height={40} mb={16}>
            <TabSelector
              labels={[t("assets.title"), t("accounts.title")]}
              onToggle={handleToggle}
            />
          </Box>
          <Flex flexDirection="row" overflow="hidden" onLayout={handleLayout} width="200%">
            <Animated.View style={[{ flex: 1 }, assetsAnimatedStyle]}>
              <AssetsListView
                sourceScreenName={ScreenName.Portfolio}
                limitNumberOfAssets={maxAssetsToDisplay}
              />
            </Animated.View>
            <Animated.View style={[{ flex: 1 }, accountsAnimatedStyle]}>
              <AccountsListView
                sourceScreenName={ScreenName.Portfolio}
                limitNumberOfAccounts={maxAssetsToDisplay}
              />
            </Animated.View>
          </Flex>
        </>
      ) : (
        <Assets assets={assetsToDisplay} />
      )}
      {showAddAccountButton ? <AddAccountButton sourceScreenName="Wallet" /> : null}
      {distribution.list.length < maxAssetsToDisplay ? (
        <Button
          type="shade"
          size="large"
          outline
          mt={6}
          iconPosition="left"
          Icon={IconsLegacy.PlusMedium}
          onPress={openAddModal}
        >
          {t("account.emptyState.addAccountCta")}
        </Button>
      ) : (
        <Button type="shade" size="large" outline onPress={onPressButton}>
          {showAssets ? t("portfolio.seeAllAssets") : t("portfolio.seeAllAccounts")}
        </Button>
      )}
    </>
  );
};

export default React.memo(PortfolioAssets);
