// @flow
import { getEnv } from "@ledgerhq/live-common/lib/env";
import React, { useCallback, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { closeModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Stepper from "~/renderer/components/Stepper";
import StepSign from "./steps/StepSign";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import type { St, StepProps } from "./types";

type OwnProps = {|
  onClose: () => void,
  data: {
    account: Account,
    message: MessageData | TypedMessageData,
    useMock: boolean,
    onConfirmationHandler: Function,
    onFailHandler: Function,
  },
|};

type Props = OwnProps;

const StepConnectDeviceFooter = (params: any) => {
  const dispatch = useDispatch();

  const { onConfirmationHandler, onFailHandler } = params;

  console.log({ params });

  return (
    <Box horizontal flow={2}>
      <Button
        onClick={() => {
          onConfirmationHandler();
          dispatch(closeModal("MODAL_SIGN_MESSAGE"));
        }}
      >
        Mock message sign success
      </Button>
      <Button
        onClick={() => {
          onFailHandler(new Error("Mocked sign message error"));
          dispatch(closeModal("MODAL_SIGN_MESSAGE"));
        }}
      >
        Mock message sign error
      </Button>
    </Box>
  );
};

const createSteps = (useMock = false): St[] => {
  const steps: Array<St> = [
    {
      id: "summary",
      label: <Trans i18nKey="signmessage.steps.summary.title" />,
      component: StepSummary,
      footer: StepSummaryFooter,
    },
    {
      id: "sign",
      label: <Trans i18nKey="signmessage.steps.sign.title" />,
      component: StepSign,
      footer: getEnv("SANDBOX_MODE") === 1 && useMock ? StepConnectDeviceFooter : undefined,
      onBack: ({ transitionTo }: StepProps) => {
        transitionTo("summary");
      },
    },
  ];

  return steps;
};

const Body = ({ onClose, data }: Props) => {
  const { t } = useTranslation();
  const [stepId, setStepId] = useState("summary");

  const steps = createSteps(data.useMock);

  const handleStepChange = useCallback(e => setStepId(e.id), [setStepId]);

  const stepperProps = {
    title: t("signmessage.title"),
    account: data.account,
    onStepChange: handleStepChange,
    stepId,
    steps,
    message: data.message,
    onConfirmationHandler: data.onConfirmationHandler,
    onFailHandler: data.onFailHandler,
    onClose,
  };

  return (
    <Stepper {...stepperProps}>
      <Track onUnmount event="CloseModalWalletConnectPasteLink" />
    </Stepper>
  );
};

export default Body;
