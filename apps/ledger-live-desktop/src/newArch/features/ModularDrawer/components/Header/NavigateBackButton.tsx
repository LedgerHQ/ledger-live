import React from "react";
import { Icons } from "@ledgerhq/react-ui";
import styled from "styled-components";

export type BackButtonProps = {
  hidden: boolean;
  onClick: () => void;
};

export const NavigateBackButton = ({ hidden, onClick }: Readonly<BackButtonProps>) => {
  if (hidden) return null;

  return (
    <BackButton onClick={onClick} data-testid="mad-back-button">
      <Icons.ArrowLeft />
    </BackButton>
  );
};

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
  pointer-events: all;
  &:hover {
    background-color: ${p => p.theme.colors.palette.neutral.c30};
  }
`;
