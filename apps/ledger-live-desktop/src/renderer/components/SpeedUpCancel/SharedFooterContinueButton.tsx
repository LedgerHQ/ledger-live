import React from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";

type Props = {
  id: string;
  disabled: boolean;
  isLoading?: boolean;
  onClick: () => void;
};

export const SharedFooterContinueButton = ({ id, disabled, isLoading, onClick }: Props) => {
  return (
    <Button id={id} isLoading={isLoading} primary disabled={disabled} onClick={onClick}>
      <Trans i18nKey="common.continue" />
    </Button>
  );
};
