import React from "react";
import { Trans } from "react-i18next";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import DefaultStepAmount, {
  StepAmountFooter as DefaultStepAmountFooter,
} from "~/renderer/modals/Send/steps/StepAmount";
import DefaultStepSummary, {
  StepSummaryFooter as DefaultStepSummaryFooter,
} from "~/renderer/modals/Send/steps/StepSummary";
import DefaultStepConnectDevice from "~/renderer/modals/Send/steps/StepConnectDevice";
import DefaultStepConfirmation, {
  StepConfirmationFooter as DefaultStepConfirmationFooter,
} from "~/renderer/modals/Send/steps/StepConfirmation";
import StepRecipient from "./modals/send/steps/StepRecipient";
import StepRecipientFooter from "./modals/send/steps/StepRecipientFooter";
import StepMandatoryPrivateSync from "./modals/send/steps/StepMandatoryPrivateSync";
import StepRecordPicker from "./modals/send/steps/StepRecordPicker";
import StepRecordPickerFooter from "./modals/send/steps/StepRecordPickerFooter";
import type { St } from "./modals/send/types";
import type { AleoFamily } from "./types";

const createSendSteps: NonNullable<AleoFamily["createSendSteps"]> = () => {
  return [
    {
      id: "recipient",
      label: <Trans i18nKey="send.steps.recipient.title" />,
      component: StepRecipient,
      footer: StepRecipientFooter,
      onBack: null,
    },
    {
      id: "private-sync",
      excludeFromBreadcrumb: true,
      component: StepMandatoryPrivateSync,
      onBack: ({ transitionTo }) => transitionTo("recipient"),
    },
    {
      id: "record-picker",
      excludeFromBreadcrumb: true,
      component: StepRecordPicker,
      footer: StepRecordPickerFooter,
      onBack: ({ transitionTo }) => transitionTo("recipient"),
    },
    {
      id: "amount",
      label: <Trans i18nKey="send.steps.amount.title" />,
      component: DefaultStepAmount,
      footer: DefaultStepAmountFooter,
      onBack: ({ transitionTo, transaction }) => {
        if (transaction?.family !== "aleo") return null;
        const targetStep = isPrivateTransaction(transaction) ? "record-picker" : "recipient";
        transitionTo(targetStep);
      },
    },
    {
      id: "summary",
      label: <Trans i18nKey="send.steps.summary.title" />,
      component: DefaultStepSummary,
      footer: DefaultStepSummaryFooter,
      onBack: ({ transitionTo }) => transitionTo("amount"),
    },
    {
      id: "device",
      label: <Trans i18nKey="send.steps.device.title" />,
      component: DefaultStepConnectDevice,
      onBack: ({ transitionTo }) => transitionTo("summary"),
    },
    {
      id: "confirmation",
      label: <Trans i18nKey="send.steps.confirmation.title" />,
      excludeFromBreadcrumb: true,
      component: DefaultStepConfirmation,
      footer: DefaultStepConfirmationFooter,
      onBack: null,
    },
  ] satisfies St[];
};

export default createSendSteps;
