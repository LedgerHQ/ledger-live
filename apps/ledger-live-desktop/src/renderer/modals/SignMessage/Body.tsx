import React, { useCallback, useMemo, useState } from "react";
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
  onConfirmationHandler: (arg: string) => void;
  onFailHandler: (arg: Error) => void;
  onClose: () => void;
  useApp?: string;
  dependencies?: string[];
  isACRE?: boolean;
};

const eip712Step: Array<St> = [
  {
    id: "sign",
    label: "",
    component: StepSign,
  },
];

const messageSteps: Array<St> = [
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

type OwnProps = {
  onClose?: () => void;
  data: Data;
};
type Props = OwnProps;

const Body = ({ onClose, data }: Props) => {
  const steps = useMemo(() => {
    return data.message.standard === "EIP712" ? eip712Step : messageSteps;
  }, [data.message.standard]);
  const { t } = useTranslation();
  const [stepId, setStepId] = useState(data.message.standard === "EIP712" ? "sign" : "summary");
  const handleStepChange = useCallback((e: { id: string }) => setStepId(e.id), [setStepId]);
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
    isACRE: data.isACRE,
    useApp: data.useApp,
    dependencies: data.dependencies,
    message: data.message,
    hideBreadcrumb: data.message.standard === "EIP712",
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
