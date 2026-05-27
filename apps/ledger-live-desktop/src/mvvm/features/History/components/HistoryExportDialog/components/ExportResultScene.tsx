import React from "react";
import {
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogClose,
  Button,
  DialogBody,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import {
  HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE,
  HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME,
} from "../constants";

const VARIANTS = {
  success: {
    gradient: "bg-gradient-success",
    spotAppearance: "check",
    titleKey: "history.exportDialog.successTitle",
    descriptionKey: "history.exportDialog.successDescription",
    buttonKey: "history.exportDialog.done",
  },
  error: {
    gradient: "bg-gradient-error",
    spotAppearance: "error",
    titleKey: "history.exportDialog.errorTitle",
    descriptionKey: "history.exportDialog.errorDescription",
    buttonKey: "history.exportDialog.tryAgain",
  },
} as const;

type Props = Readonly<{
  variant: keyof typeof VARIANTS;
  onButtonClick?: () => void;
}>;

export function ExportResultScene({ variant, onButtonClick }: Props) {
  const { t } = useTranslation();
  const config = VARIANTS[variant];

  const button = (
    <Button appearance="base" size="lg" isFull onClick={onButtonClick}>
      {t(config.buttonKey)}
    </Button>
  );

  return (
    <DialogContent>
      {variant === "success" ? (
        <TrackPage
          category={HISTORY_EXPORT_DIALOG_TRACKING_PAGE_NAME}
          name={HISTORY_EXPORT_DIALOG_SUCCESS_TRACKING_PAGE.name}
          refreshSource={false}
        />
      ) : null}
      <DialogHeader density="compact" className="relative" />
      <DialogBody>
        <div className="flex flex-col items-center gap-24">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-full ${config.gradient}`}
          />
          <Spot appearance={config.spotAppearance} size={72} />
          <div className="flex flex-col items-center gap-12 text-center">
            <span
              className="heading-4-semi-bold text-base"
              data-testid={`history-export-${variant}-title`}
            >
              {t(config.titleKey)}
            </span>
            <p className="body-2 text-muted">{t(config.descriptionKey)}</p>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        {variant === "success" ? <DialogClose asChild>{button}</DialogClose> : button}
      </DialogFooter>
    </DialogContent>
  );
}
