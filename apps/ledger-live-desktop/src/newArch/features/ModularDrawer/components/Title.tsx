import { Text } from "@ledgerhq/react-ui/index";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { MODULAR_DRAWER_STEP, ModularDrawerStep } from "../types";

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [MODULAR_DRAWER_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DRAWER_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DRAWER_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
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

const TitleContainer = styled.div`
  padding: 0 0 16px 8px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
`;

const TitleText = styled(Text)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  column-gap: 1px;
  font-size: 24px;
  font-weight: 600;
  color: var(--palette-text-shade100);
  flex: 1;
`;
