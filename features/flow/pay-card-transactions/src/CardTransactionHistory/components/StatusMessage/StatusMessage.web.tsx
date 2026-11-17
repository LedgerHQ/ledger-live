import React, { type ReactNode } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import type { StatusMessageState } from "../types";

const SPOT_TEXT_OVERLAP_STYLE = { marginTop: -56 } as const;

export type StatusMessageProps = Readonly<{
  spot: ReactNode;
  state: StatusMessageState;
  testId: string;
  action?: Readonly<{ testId: string; onClick: () => void }>;
  hasDisclaimer?: boolean;
  overlapSpot?: boolean;
}>;

export function StatusMessage({
  spot,
  state,
  testId,
  action,
  hasDisclaimer = false,
  overlapSpot = false,
}: StatusMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-24 pt-48" data-testid={testId}>
      {spot}
      <div
        className="relative flex flex-col items-center gap-4 text-center"
        style={overlapSpot ? SPOT_TEXT_OVERLAP_STYLE : undefined}
      >
        <span className="heading-4-semi-bold text-base">
          {t(`payTab.cardTransactions.history.${state}.title`)}
        </span>
        <span className="body-2 text-muted">
          {t(`payTab.cardTransactions.history.${state}.description`)}
        </span>
      </div>
      {action ? (
        <Button appearance="base" onClick={action.onClick} data-testid={action.testId}>
          {t("payTab.cardTransactions.history.goToPay")}
        </Button>
      ) : null}
      {hasDisclaimer ? (
        <span className="body-3 text-center text-muted">{t("payTab.disclaimer")}</span>
      ) : null}
    </div>
  );
}
