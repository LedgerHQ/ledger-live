// @flow

import React from "react";
import { Grid } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";

const ButtonGrid = styled(Grid).attrs(() => ({
  columns: 3,
  columnGap: 4,
}))`
  margin-top: ${p => p.theme.space[4]}px;
  margin-bottom: ${p => p.theme.space[6]}px;
`;

const FeaturedButtons = () => {
  const { t } = useTranslation();

  return (
    <ButtonGrid>
      <EntryButton
        title={t("dashboard.featuredButtons.buySell.title")}
        body={t("dashboard.featuredButtons.buySell.description")}
        onClick={() => {
          // to be implemented
        }}
      />
      <EntryButton
        title={t("dashboard.featuredButtons.swap.title")}
        body={t("dashboard.featuredButtons.swap.description")}
        label={t("dashboard.featuredButtons.swap.label")}
        onClick={() => {
          // to be implemented
        }}
      />
      <EntryButton
        title={t("dashboard.featuredButtons.earn.title")}
        body={t("dashboard.featuredButtons.earn.description")}
        disabled={true}
        onClick={() => {
          // to be implemented
        }}
      />
    </ButtonGrid>
  );
};
export default FeaturedButtons;
