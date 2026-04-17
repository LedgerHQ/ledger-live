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
  onAction?: () => void;
}>;

export function ExportResultScene({ variant, onAction }: Props) {
  const { t } = useTranslation();
  const config = VARIANTS[variant];

  const button = (
    <Button appearance="base" size="lg" isFull onClick={onAction}>
      {t(config.buttonKey)}
    </Button>
  );

  return (
    <DialogContent>
      <DialogHeader density="compact" className="relative" />
      <DialogBody>
        <div className="flex flex-col items-center gap-24">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-full ${config.gradient}`}
          />
          <Spot appearance={config.spotAppearance} size={72} />
          <div className="flex flex-col items-center gap-12 text-center">
            <span className="heading-4-semi-bold text-base">{t(config.titleKey)}</span>
            <p className="body-2 text-muted">{t(config.descriptionKey)}</p>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>{onAction ? button : <DialogClose asChild>{button}</DialogClose>}</DialogFooter>
    </DialogContent>
  );
}
