import React, { memo } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Stepper,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { CardOnboardingOption } from "./CardOnboardingOption/CardOnboardingOption";
import type { CardOnboardingDialogViewProps } from "./useCardOnboardingDialogViewModel";

export const CardOnboardingDialogView = memo(function CardOnboardingDialogView({
  isOpen,
  dialogTitle,
  options,
  completedCount,
  totalCount,
  handleClose,
  onboardingCompleted,
  handleGotIt,
}: CardOnboardingDialogViewProps) {
  const { t } = useTranslation();

  const handleOpenChange = (open: boolean) => {
    if (!open) handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-auto max-h-[90vh] flex-col gap-0"
        aria-describedby={undefined}
      >
        <DialogHeader onClose={handleClose} className="!mb-0 shrink-0" />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto p-16 pt-0">
          <div className="flex flex-col gap-8 p-8 pb-16">
            <Stepper currentStep={completedCount} totalSteps={totalCount} />
            <h2 className="heading-3-semi-bold text-base">{dialogTitle}</h2>
          </div>
          {options.map(option => (
            <CardOnboardingOption key={option.id} {...option} />
          ))}
        </DialogBody>
        {onboardingCompleted ? (
          <DialogFooter>
            <Button appearance="base" size="lg" className="w-full" isFull onClick={handleGotIt}>
              {t("payTab.cardOnboarding.dialog.gotIt")}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
});
