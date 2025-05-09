import React from "react";
import { Icons } from "@ledgerhq/react-ui";
import { BackButton } from "./StyledComponents";

export type BackButtonProps = {
  hidden: boolean;
  onClick: () => void;
};

export const NavigateBackButton = ({ hidden, onClick }: Readonly<BackButtonProps>) => {
  if (hidden) return null;

  return (
    <BackButton onClick={onClick} data-testid="select-asset-back-button">
      <Icons.ArrowLeft />
    </BackButton>
  );
};
