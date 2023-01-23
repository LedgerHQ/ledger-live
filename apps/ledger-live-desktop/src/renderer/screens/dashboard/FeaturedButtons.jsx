// @flow

import React from "react";
import Box from "~/renderer/components/Box";
import { Flex, Grid } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";

const BodyText = styled(Text).attrs(p => ({
  fontSize: 4,
  fontWeight: "medium",
  color: p.theme.colors.neutral.c70,
}))``;

const TitleText = styled(Text).attrs(p => ({
  fontSize: 4,
  fontWeight: "semiBold",
  color: p.theme.colors.neutral.c100,
  mb: "2px",
}))``;

const FeaturedButtonContainer = styled(Flex)`
  flex-grow: 1;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-radius: 4px;
  padding: ${p => p.theme.space[3]}px;
  align-items: center;
  gap: ${p => p.theme.space[3]}px;

  &:hover {
    cursor: pointer;
    color: ${p => p.theme.colors.primary.c90};
    background-color: ${p => p.theme.colors.primary.c10};

    ${BodyText} {
      color: ${p => p.theme.colors.primary.c80};
    }

    ${TitleText} {
      color: ${p => p.theme.colors.primary.c90};
    }
  }
`;

const Container = styled(Grid).attrs(() => ({
  columns: 3,
  columnGap: 4,
}))`
  margin-top: ${p => p.theme.space[4]}px;
  margin-bottom: ${p => p.theme.space[6]}px;
`;

const FeaturedButton = ({ title, body }: { title: string, body: string }) => {
  return (
    <FeaturedButtonContainer>
      <div>Icon</div>
      <Box shrink>
        <TitleText>{title}</TitleText>
        <BodyText>{body}</BodyText>
      </Box>
    </FeaturedButtonContainer>
  );
};

const FeaturedButtons = () => {
  const { t } = useTranslation();

  return (
    <Container>
      <FeaturedButton
        title={t("dashboard.featuredButtons.buySell.title")}
        body={t("dashboard.featuredButtons.buySell.description")}
      />
      <FeaturedButton
        title={t("dashboard.featuredButtons.swap.title")}
        body={t("dashboard.featuredButtons.swap.description")}
        label={t("dashboard.featuredButtons.swap.label")}
      />
      <FeaturedButton
        title={t("dashboard.featuredButtons.earn.title")}
        body={t("dashboard.featuredButtons.earn.description")}
      />
    </Container>
  );
};
export default FeaturedButtons;
