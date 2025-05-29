import React from "react";
import styled from "styled-components";
import { Title } from "./Title";
import { ModularDrawerStep, MODULAR_DRAWER_STEP } from "../../types";
import { track } from "~/renderer/analytics/segment";
import { Icons } from "@ledgerhq/react-ui/index";

type Props = {
  onBackClick?: () => void;
  step: ModularDrawerStep;
};

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [MODULAR_DRAWER_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DRAWER_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DRAWER_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

export const Header = ({ step, onBackClick }: Props) => {
  const handleBackClick = onBackClick
    ? () => {
        track("button_clicked", {
          step,
          button: "modularDrawer_backButton",
        });
        onBackClick();
      }
    : undefined;

  return (
    <HeaderContainer>
      {handleBackClick && (
        <BackButton onClick={handleBackClick} data-testid="mad-back-button">
          <Icons.ArrowLeft />
        </BackButton>
      )}
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

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: absolute;
  top: 20px;
  left: 16px;
  z-index: 1000;
`;
