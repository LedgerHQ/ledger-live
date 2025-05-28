import React from "react";
import { NavigateBackButton } from "./NavigateBackButton";
import styled from "styled-components";
import { Title } from "./Title";
import { ModularDrawerStep, MODULAR_DRAWER_STEP } from "../../types";
import { track } from "~/renderer/analytics/segment";

type Props = {
  step: ModularDrawerStep;
  hidden?: boolean;
  onBackClick?: () => void;
};

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [MODULAR_DRAWER_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DRAWER_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DRAWER_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

export const Header = ({ step, hidden, onBackClick }: Props) => {
  const handleBackClick = () => {
    track("button_clicked", {
      step,
      button: "modularDrawer_backButton",
    });
    onBackClick();
  };

  return (
    <HeaderContainer>
      <NavigateBackButton hidden={hidden} onClick={handleBackClick} />
      <Title translationKey={TranslationKeyMap[step]} />
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  padding: 0px 0 16px 24px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
`;
