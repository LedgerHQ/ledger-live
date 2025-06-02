import React from "react";
import styled from "styled-components";
import { Title } from "./Title";
import { ModularDrawerAddAccountStep, MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "../../types";
import { track } from "~/renderer/analytics/segment";
import { Icons } from "@ledgerhq/react-ui/index";

type Props = {
  onBackClick?: () => void;
  step: ModularDrawerAddAccountStep;
};

// TODO probably unnecessary
const TranslationKeyMap: Record<ModularDrawerAddAccountStep, string> = {
  [MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE]: "modularAssetDrawer.connectYourDevice",
  [MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS]: "modularAssetDrawer.scanAccounts",
  [MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED]: "modularAssetDrawer.addAccounts",
};

export const AddAccountHeader = ({ step, onBackClick }: Props) => {
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

// TODO re-use styles
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
