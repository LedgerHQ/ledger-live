import React, { useCallback } from "react";
import { Button, DialogBody, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";

export function RecentHistoryScreen() {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();

  const goBackToRecipient = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.RECIPIENT);
  }, [navigation]);

  return (
    <>
      <DialogBody className="py-16 -mb-6" data-testid="send-recipient-recent-history-step">
        <div className="flex flex-col gap-16">
          <h1 className="-mt-24 mb-6 heading-2-semi-bold text-base">
            {t("newSendFlow.recentHistory.dialog.title")}
          </h1>
          <p className="m-0 body-1 wrap-break-word whitespace-normal text-base">
            {t("newSendFlow.recentHistory.dialog.description")}
          </p>
        </div>
      </DialogBody>
      <DialogFooter className="justify-center px-24">
        <Button
          className="mt-12 w-full"
          appearance="base"
          size="lg"
          onClick={goBackToRecipient}
          data-testid="send-recipient-recent-history-step-close"
        >
          {t("newSendFlow.recentHistory.dialog.cta")}
        </Button>
      </DialogFooter>
    </>
  );
}
