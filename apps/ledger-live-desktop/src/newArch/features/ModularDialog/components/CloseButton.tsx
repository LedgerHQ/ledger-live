import { Icons } from "@ledgerhq/react-ui/index";
import React from "react";
import styled from "styled-components";

type Props = {
  onRequestClose: (mouseEvent: React.MouseEvent<Element, MouseEvent>) => void;
};

export const CloseButton = ({ onRequestClose }: Props) => {
  return (
    <CloseIconWrapper onClick={onRequestClose} data-testid="mad-close-button">
      <Icons.Close size="XS" />
    </CloseIconWrapper>
  );
};

const CloseIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  position: absolute;
  top: 16px;
  right: 24px;
  z-index: 1000;
  background-color: red;
  border-radius: 1000px;
  background-color: ${p => p.theme.colors.opacityDefault.c05};
`;
