import React, { useCallback } from "react";
import { Grid } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import Swap from "~/renderer/icons/Swap";
import Exchange from "~/renderer/icons/Exchange";
import Growth from "~/renderer/icons/Growth";
import { useHistory } from "react-router-dom";
import useStakeFlow from "~/renderer/screens/stake";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const ButtonGrid = styled(Grid).attrs(() => ({
  columns: 3,
  columnGap: 4,
}))`
  margin-top: ${p => p.theme.space[4]}px;
  margin-bottom: ${p => p.theme.space[6]}px;
`;

const devFeatureFlag = false;

const FeaturedButtons = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const handleClickExchange = useCallback(() => {
    history.push("/exchange");
  }, [history]);

  const handleClickSwap = useCallback(() => {
    history.push("/swap");
  }, [history]);

  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const stakeDisabled = stakeProgramsFeatureFlag?.params?.list?.length === 0 ?? true;
  const startStakeFlow = useStakeFlow({});

  if (!devFeatureFlag) return null;

  return (
    <ButtonGrid>
      <EntryButton
        Icon={() => <Exchange />}
        title={t("dashboard.featuredButtons.buySell.title")}
        body={t("dashboard.featuredButtons.buySell.description")}
        onClick={handleClickExchange}
      />
      <EntryButton
        Icon={() => <Swap />}
        title={t("dashboard.featuredButtons.swap.title")}
        body={t("dashboard.featuredButtons.swap.description")}
        label={t("dashboard.featuredButtons.swap.label")}
        onClick={handleClickSwap}
      />
      <EntryButton
        Icon={() => <Growth />}
        disabled={stakeDisabled}
        title={t("dashboard.featuredButtons.earn.title")}
        body={t("dashboard.featuredButtons.earn.description")}
        onClick={startStakeFlow}
      />
    </ButtonGrid>
  );
};
export default FeaturedButtons;
