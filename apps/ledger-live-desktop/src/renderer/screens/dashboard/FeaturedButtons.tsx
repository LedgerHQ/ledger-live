import React, { useCallback } from "react";
import { Grid, IconsLegacy } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import { useHistory } from "react-router-dom";
import useStakeFlow from "~/renderer/screens/stake";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { track } from "~/renderer/analytics/segment";

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

  const bannerFeatureFlag = useFeature("portfolioExchangeBanner");
  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const { enabled: bannerEnabled } = bannerFeatureFlag || { enabled: false };

  const stakeDisabled = stakeProgramsFeatureFlag?.params?.list?.length === 0 ?? true;
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

    startStakeFlow({ source: "Portafolio" });
  }, [startStakeFlow]);

  if (!bannerEnabled) return null;

  return (
    <ButtonGrid>
      <EntryButton
        Icon={() => <IconsLegacy.BuyCryptoAltMedium size={18} />}
        title={t("dashboard.featuredButtons.buySell.title")}
        body={t("dashboard.featuredButtons.buySell.description")}
        onClick={handleClickExchange}
        entryButtonTestId="buy-sell-entry-button"
      />
      <EntryButton
        Icon={() => <IconsLegacy.BuyCryptoMedium size={18} />}
        title={t("dashboard.featuredButtons.swap.title")}
        body={t("dashboard.featuredButtons.swap.description")}
        label={t("dashboard.featuredButtons.swap.label")}
        onClick={handleClickSwap}
        entryButtonTestId="swap-entry-button"
      />
      <EntryButton
        Icon={() => <IconsLegacy.LendMedium size={18} />}
        disabled={stakeDisabled}
        title={t("dashboard.featuredButtons.earn.title")}
        body={t("dashboard.featuredButtons.earn.description")}
        onClick={handleClickStake}
        entryButtonTestId="stake-entry-button"
      />
    </ButtonGrid>
  );
};
export default FeaturedButtons;
