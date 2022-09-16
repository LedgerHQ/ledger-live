import React from "react";
import { Trans } from "react-i18next";
import { Flex } from "@ledgerhq/native-ui";
import { InfoMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";
import LText from "../../components/LText";

const Container = styled(Flex).attrs(() => ({
  backgroundColor: "neutral.c30",
  padding: 5,
  borderRadius: 2,
  marginBottom: 6,
  marginLeft: 6,
  marginRight: 6,
}))``;

export default function StakingRewardsBanner() {
  return (
    <Container>
      <Flex flexDirection={"row"} alignItems={"center"} flex={1}>
        <InfoMedium size={20} color={"neutral.c80"} />
        <LText ml={3} color="neutral.c80" fontWeight="semiBold">
          <Trans i18nKey="cardano.info.balanceDoesNotIncludeRewards.title" />
        </LText>
      </Flex>
    </Container>
  );
}
