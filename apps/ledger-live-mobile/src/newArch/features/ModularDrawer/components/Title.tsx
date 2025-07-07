import React from "react";
import styled from "styled-components/native";
import { Box, Text } from "@ledgerhq/native-ui";
import { ModularDrawerStep } from "../types";
import { useTranslation } from "react-i18next";

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [ModularDrawerStep.Asset]: "modularDrawer.selectAsset",
  [ModularDrawerStep.Network]: "modularDrawer.selectNetwork",
  [ModularDrawerStep.Account]: "modularDrawer.selectAccount",
};

type Props = {
  step: ModularDrawerStep;
};

export const Title = ({ step }: Props) => {
  const { t } = useTranslation();

  return (
    <TitleContainer>
      <TitleText>{t(TranslationKeyMap[step])}</TitleText>
    </TitleContainer>
  );
};

const TitleContainer = styled(Box)`
  padding-top: 0px;
  padding-bottom: 16px;
  padding-left: 8px;
  padding-right: 0px;
  flex: 0 1 auto;
  width: 100%;
  flex-direction: row;
  align-items: center;
`;

const TitleText = styled(Text)`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.theme.colors.neutral.c100};
  flex: 1;
`;
