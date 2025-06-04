import { Icons } from "@ledgerhq/react-ui/index";
import React from "react";
import styled from "styled-components";
import { track } from "~/renderer/analytics/segment";
import { ModularDrawerAddAccountStep } from "../../types";

type Props = {
  onBackClick?: () => void;
  step: ModularDrawerAddAccountStep;
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
    </HeaderContainer>
  );
};

// TODO review utility
const HeaderContainer = styled.div``;

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
