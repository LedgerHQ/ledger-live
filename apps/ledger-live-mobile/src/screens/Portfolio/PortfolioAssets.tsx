import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useStartProfiler } from "@shopify/react-native-performance";
import { GestureResponderEvent } from "react-native";
import { useDistribution } from "~/actions/general";
import { TrackScreen } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { Box } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { blacklistedTokenIdsSelector, discreetModeSelector } from "~/reducers/settings";
import Assets from "./Assets";
import PortfolioQuickActionsBar from "./PortfolioQuickActionsBar";

type Props = {
  hideEmptyTokenAccount: boolean;
  openAddModal: () => void;
};

const maxAssetsToDisplay = 5;

const PortfolioAssets = ({ hideEmptyTokenAccount, openAddModal }: Props) => {
  const { t } = useTranslation();
  const llmWalletQuickActions = useFeature("llmWalletQuickActions");
  const navigation = useNavigation();
  const startNavigationTTITimer = useStartProfiler();
  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });
  const discreetMode = useSelector(discreetModeSelector);

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const assetsToDisplay = useMemo(
    () =>
      distribution.list
        .filter(asset => {
          return (
            asset.currency.type !== "TokenCurrency" ||
            !blacklistedTokenIds.includes(asset.currency.id)
          );
        })
        .slice(0, maxAssetsToDisplay),
    [distribution, blacklistedTokenIds],
  );

  const goToAssets = useCallback(
    (uiEvent: GestureResponderEvent) => {
      startNavigationTTITimer({ source: ScreenName.Portfolio, uiEvent });
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    },
    [startNavigationTTITimer, navigation],
  );

  return (
    <>
      <TrackScreen
        category="Wallet"
        accountsLength={distribution.list && distribution.list.length}
        discreet={discreetMode}
      />
      {llmWalletQuickActions?.enabled ? (
        <Box mb={24} mt={18}>
          <PortfolioQuickActionsBar />
        </Box>
      ) : null}
      <Assets assets={assetsToDisplay} />
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
        <Button type="shade" size="large" outline mt={6} onPress={goToAssets}>
          {t("portfolio.seelAllAssets")}
        </Button>
      )}
    </>
  );
};

export default React.memo(PortfolioAssets);
