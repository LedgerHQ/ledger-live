import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import type { StatusMessageProps } from "./types";

export function StatusMessage({
  spot,
  titleKey,
  descriptionKey,
  testId,
  action,
}: StatusMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-24 pt-48" data-testid={testId}>
      {spot}
      <span className="heading-4-semi-bold text-base">{t(titleKey)}</span>
      <span className="body-2 text-muted">{t(descriptionKey)}</span>
      {action ? (
        <Button appearance="base" onClick={action.onClick} data-testid={action.testId}>
          {t(action.labelKey)}
        </Button>
      ) : null}
    </div>
  );
}
