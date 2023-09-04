import React, { useCallback, useState } from "react";
import { AccountLike, AnyMessage } from "@ledgerhq/types-live";
import Track from "~/renderer/analytics/Track";
import { Trans, useTranslation } from "react-i18next";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import StepSign from "./steps/StepSign";
import { St, StepProps } from "./types";
import Stepper from "~/renderer/components/Stepper";

export type Data = {
  account: AccountLike;
  message: AnyMessage;
  onConfirmationHandler: Function;
  onFailHandler: Function;
  onClose: () => void;
};

type OwnProps = {
  onClose?: () => void;
  data: Data;
};
type Props = OwnProps;
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
    onBack: ({ transitionTo }: StepProps) => {
      transitionTo("summary");
    },
  },
];
const Body = ({ onClose, data }: Props) => {
  const { t } = useTranslation();
  const [stepId, setStepId] = useState("summary");
  const handleStepChange = useCallback(e => setStepId(e.id), [setStepId]);
  const stepperOnClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    if (data.onClose) {
      data.onClose();
    }
  }, [data, onClose]);
  const stepperProps = {
    title: t("signmessage.title"),
    account: data.account,
    onStepChange: handleStepChange,
    stepId,
    steps,
    message: data.message,
    onConfirmationHandler: data.onConfirmationHandler,
    onFailHandler: data.onFailHandler,
    onClose: stepperOnClose,
  };
  return (
    <Stepper {...stepperProps}>
      <Track onUnmount event="CloseModalWalletConnectPasteLink" />
    </Stepper>
  );
};
export default Body;
