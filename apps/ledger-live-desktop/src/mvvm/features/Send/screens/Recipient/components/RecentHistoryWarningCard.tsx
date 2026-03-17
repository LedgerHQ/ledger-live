import React, { useCallback } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";

export function RecentHistoryWarningCard() {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();

  const openRecentHistoryStep = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.RECENT_HISTORY);
  }, [navigation]);

  return (
    <div
      className="mt-12 rounded-xl bg-surface px-16 py-16"
      data-testid="send-recent-history-warning"
    >
      <div className="flex items-start gap-12">
        <Information size={20} className="mt-2 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-16">
          <p className="body-2 text-base leading-[24px] whitespace-normal break-words text-left">
            {t("newSendFlow.recentHistory.banner.description")}
          </p>
          <Button
            className="self-start"
            appearance="gray"
            size="sm"
            onClick={openRecentHistoryStep}
          >
            {t("common.learnMore")}
          </Button>
        </div>
      </div>
    </div>
  );
}
