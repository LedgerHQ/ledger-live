import React from "react";
import { Trans } from "react-i18next";
import { getReceiveFlowError } from "@ledgerhq/live-common/account/index";

import Button from "~/renderer/components/Button";
import type { StepId, StepProps } from "../types";

export function StepAccountFooter({
  transitionTo,
  isAssociationFlow,
  receiveTokenMode,
  token,
  account,
  parentAccount,
  status,
}: StepProps) {
  const error = account ? getReceiveFlowError(account, parentAccount) : null;
  const isMissingToken = receiveTokenMode && !token;
  const isTransactionError = Object.keys(status.errors).length > 0;

  const redirectToDeviceStep = () => {
    const deviceStepId: StepId = isAssociationFlow ? "associationDevice" : "device";
    transitionTo(deviceStepId);
  };

  return (
    <Button
      primary
      data-testid="modal-continue-button"
      disabled={!account || isMissingToken || !!error || isTransactionError}
      onClick={redirectToDeviceStep}
    >
      <Trans i18nKey="common.continue" />
    </Button>
  );
}
