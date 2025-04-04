import React, { useCallback } from "react";
import { Grid, Icons } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import { useHistory } from "react-router-dom";
import useStakeFlow from "~/renderer/screens/stake";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "~/renderer/analytics/segment";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

const ButtonGrid = styled(Grid).attrs(() => ({
  columns: 3,
  columnGap: 4,
}))`
  margin-top: ${p => p.theme.space[4]}px;
  margin-bottom: ${p => p.theme.space[6]}px;
`;

const FeaturedButtons = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const stakeLabel = useGetStakeLabelLocaleBased();
  const bannerFeatureFlag = useFeature("portfolioExchangeBanner");

  const { enabled: bannerEnabled } = bannerFeatureFlag || { enabled: false };

  const startStakeFlow = useStakeFlow();

  const handleClickExchange = useCallback(() => {
    track("button_clicked2", { button: "buy", flow: "Buy", page: "portfolio" });

    history.push("/exchange");
  }, [history]);

  const handleClickSwap = useCallback(() => {
    track("button_clicked2", { button: "swap", flow: "Swap", page: "portfolio" });

    history.push("/swap");
  }, [history]);

  const handleClickStake = useCallback(() => {
    track("button_clicked2", { button: "stake", flow: "stake", page: "portfolio" });

    startStakeFlow({ source: "Portfolio" });
  }, [startStakeFlow]);

  if (!bannerEnabled) return null;

  return (
    <ButtonGrid>
      <EntryButton
        Icon={() => <Icons.Dollar size="S" />}
        title={t("dashboard.featuredButtons.buySell.title")}
        body={t("dashboard.featuredButtons.buySell.description")}
        onClick={handleClickExchange}
        entryButtonTestId="buy-sell-entry-button"
      />
      <EntryButton
        Icon={() => <Icons.Exchange size="S" />}
        title={t("dashboard.featuredButtons.swap.title")}
        body={t("dashboard.featuredButtons.swap.description")}
        onClick={handleClickSwap}
        entryButtonTestId="swap-entry-button"
      />
      <EntryButton
        Icon={() => <Icons.Percentage size="S" />}
        title={stakeLabel}
        body={t("dashboard.featuredButtons.earn.description")}
        onClick={handleClickStake}
        entryButtonTestId="stake-entry-button"
      />
    </ButtonGrid>
  );
};
export default FeaturedButtons;
