import React from "react";
import { Button, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { FlowStatus } from "LLD/features/FlowWizard/types";

interface ButtonConfig {
  label: string;
  onClick: () => void;
  appearance: "gray" | "base";
}

interface ConfirmationScreenProps {
  status: FlowStatus;
  onViewDetails: () => void;
  onClose: () => void;
  onRetry: () => void;
  t: (key: string) => string;
}

export const ConfirmationFooter: React.FC<ConfirmationScreenProps> = ({
  status,
  onViewDetails,
  onClose,
  onRetry,
  t,
}) => {
  const buttonConfig: Record<FlowStatus, ButtonConfig[]> = {
    success: [
      {
        label: t("send.steps.confirmation.success.cta"),
        onClick: onViewDetails,
        appearance: "gray",
      },
      { label: t("common.close"), onClick: onClose, appearance: "base" },
    ],
    idle: [
      { label: t("common.tryAgain"), onClick: onRetry, appearance: "gray" },
      { label: t("common.close"), onClick: onClose, appearance: "base" },
    ],
    error: [
      { label: t("common.close"), onClick: onClose, appearance: "gray" },
      { label: t("common.tryAgain"), onClick: onRetry, appearance: "base" },
    ],
  };
  const buttonsToRender = buttonConfig[status] || [];

  return (
    <DialogFooter className="px-6">
      <div className="flex flex-col w-full">
        {buttonsToRender.map(({ label, onClick, appearance }, index) => (
          <Button
            key={index}
            className={index === 0 ? "mb-16" : ""}
            appearance={appearance}
            size={"lg"}
            isFull
            onClick={onClick}
          >
            {label}
          </Button>
        ))}
      </div>
    </DialogFooter>
  );
};
