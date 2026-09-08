import React from "react";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import { InformationFill, WarningFill } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { ConfirmBodyProps } from "../../../types";

const SPOT_ICON = {
  error: WarningFill,
  info: InformationFill,
} as const;

export function ConfirmBody({
  appearance,
  titleKey,
  descriptionKey,
  descriptionTestID,
  confirmLabelKey,
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmBodyProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col items-center gap-24">
        <Spot appearance="icon" icon={SPOT_ICON[appearance]} size={56} />
        <div className="flex flex-col gap-8">
          <span className="heading-4-semi-bold text-base">{t(titleKey)}</span>
          {descriptionKey ? (
            <p className="body-2 text-muted" data-testid={descriptionTestID}>
              {t(descriptionKey)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex w-full flex-col gap-8">
        <Button
          appearance="base"
          size="lg"
          isFull
          loading={isPending}
          disabled={isPending}
          onClick={onConfirm}
          data-testid="freeze-confirm-action"
        >
          {t(confirmLabelKey)}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          disabled={isPending}
          onClick={onClose}
          data-testid="freeze-confirm-cancel"
        >
          {t("payTab.card.goBack")}
        </Button>
      </div>
    </>
  );
}
