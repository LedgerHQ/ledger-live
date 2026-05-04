import React from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { StepAmountFooter as DefaultStepAmountFooter } from "~/renderer/modals/Send/steps/StepAmount";
import DefaultStepSummary, {
  StepSummaryFooter as DefaultStepSummaryFooter,
} from "~/renderer/modals/Send/steps/StepSummary";
import DefaultStepConnectDevice from "~/renderer/modals/Send/steps/StepConnectDevice";
import DefaultStepConfirmation, {
  StepConfirmationFooter as DefaultStepConfirmationFooter,
} from "~/renderer/modals/Send/steps/StepConfirmation";
import StepAmount from "./modals/send/steps/StepAmount";
import StepRecipient from "./modals/send/steps/StepRecipient";
import StepRecipientFooter from "./modals/send/steps/StepRecipientFooter";
import StepMandatoryPrivateSync from "./modals/send/steps/StepMandatoryPrivateSync";
import StepRecordPicker from "./modals/send/steps/StepRecordPicker";
import StepRecordPickerFooter from "./modals/send/steps/StepRecordPickerFooter";
import { getAleoCurrencyConfig } from "./shared/utils";
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
      onBack: ({ transitionTo, updateTransaction }) => {
        updateTransaction(t => {
          if (t.family !== "aleo" || !isPrivateTransaction(t)) return t;
          return {
            ...t,
            properties: {
              amountRecordCommitments: [],
              feeRecordCommitment: null,
            },
          };
        });

        transitionTo("recipient");
      },
    },
    {
      id: "amount",
      label: <Trans i18nKey="send.steps.amount.title" />,
      component: StepAmount,
      footer: DefaultStepAmountFooter,
      onBack: ({ transitionTo, transaction, account, parentAccount }) => {
        if (transaction?.family !== "aleo") return;
        if (!isPrivateTransaction(transaction)) {
          transitionTo("recipient");
          return;
        }

        const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : null;
        const config = mainAccount ? getAleoCurrencyConfig(mainAccount.currency) : undefined;
        const isManualStrategy = !config || config.recordPickingStrategy === "manual";
        transitionTo(isManualStrategy ? "record-picker" : "recipient");
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
