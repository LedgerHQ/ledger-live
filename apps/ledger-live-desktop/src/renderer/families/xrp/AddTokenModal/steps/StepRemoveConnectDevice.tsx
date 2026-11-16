import React from "react";
import { Trans } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import type { StepProps } from "../types";

export default function StepRemoveConnectDevice(props: StepProps) {
  return (
    <>
      {props.token?.tokenType === "iou" ? (
        <Alert type="primary" mb={4}>
          <Trans i18nKey="xrp.removeToken.steps.connectDevice.limitZero" />
        </Alert>
      ) : null}
      <GenericStepConnectDevice {...props} />
    </>
  );
}
