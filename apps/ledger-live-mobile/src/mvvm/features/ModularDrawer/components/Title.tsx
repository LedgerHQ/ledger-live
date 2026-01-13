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
      <TitleText testID={`modular-drawer-${step}-title`}>{t(TranslationKeyMap[step])}</TitleText>
    </TitleContainer>
  );
};

const TitleContainer = styled(Box)`
  margin-top: 0px;
  margin-bottom: 12px;
  margin-right: 0px;
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
