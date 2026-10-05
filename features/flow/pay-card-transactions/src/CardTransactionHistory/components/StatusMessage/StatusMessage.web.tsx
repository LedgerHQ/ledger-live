import React, { type ReactNode } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";

const SPOT_TEXT_OVERLAP_STYLE = { marginTop: -56 } as const;

export type StatusMessageProps = Readonly<{
  spot: ReactNode;
  titleKey: string;
  descriptionKey: string;
  testId: string;
  action?: Readonly<{ labelKey: string; testId: string; onClick: () => void }>;
  disclaimerKey?: string;
  overlapSpot?: boolean;
}>;

export function StatusMessage({
  spot,
  titleKey,
  descriptionKey,
  testId,
  action,
  disclaimerKey,
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
        <span className="heading-4-semi-bold text-base">{t(titleKey)}</span>
        <span className="body-2 text-muted">{t(descriptionKey)}</span>
      </div>
      {action ? (
        <Button appearance="base" onClick={action.onClick} data-testid={action.testId}>
          {t(action.labelKey)}
        </Button>
      ) : null}
      {disclaimerKey ? (
        <span className="body-3 text-center text-muted">{t(disclaimerKey)}</span>
      ) : null}
    </div>
  );
}
