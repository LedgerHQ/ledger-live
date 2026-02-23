import React from "react";
import { Button, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { FLOW_STATUS, type FlowStatus } from "@ledgerhq/live-common/flows/wizard/types";

interface ButtonConfig {
  label: string;
  onClick: () => void;
  appearance: "gray" | "base";
}

interface ConfirmationFooterProps {
  status: FlowStatus;
  onViewDetails: () => void;
  onClose: () => void;
  onRetry: () => void;
  t: (key: string) => string;
}

export const ConfirmationFooter: React.FC<ConfirmationFooterProps> = ({
  status,
  onViewDetails,
  onClose,
  onRetry,
  t,
}) => {
  const buttonConfig: Record<FlowStatus, ButtonConfig[]> = {
    [FLOW_STATUS.SUCCESS]: [
      {
        label: t("send.steps.confirmation.success.cta"),
        onClick: onViewDetails,
        appearance: "gray",
      },
      { label: t("common.close"), onClick: onClose, appearance: "base" },
    ],
    [FLOW_STATUS.IDLE]: [
      { label: t("common.tryAgain"), onClick: onRetry, appearance: "gray" },
      { label: t("common.close"), onClick: onClose, appearance: "base" },
    ],
    [FLOW_STATUS.ERROR]: [
      { label: t("common.close"), onClick: onClose, appearance: "gray" },
      { label: t("common.tryAgain"), onClick: onRetry, appearance: "base" },
    ],
  };
  const buttonsToRender = buttonConfig[status] || [];
  const getButtonTestId = (currentStatus: FlowStatus, index: number) => {
    if (currentStatus === FLOW_STATUS.SUCCESS && index === 0) {
      return "send-confirmation-view-details-button";
    }
    if (currentStatus === FLOW_STATUS.SUCCESS && index === 1) {
      return "send-confirmation-close-button";
    }
    if (currentStatus === FLOW_STATUS.IDLE && index === 0) {
      return "send-confirmation-retry-button";
    }
    if (currentStatus === FLOW_STATUS.IDLE && index === 1) {
      return "send-confirmation-close-button";
    }
    if (currentStatus === FLOW_STATUS.ERROR && index === 0) {
      return "send-confirmation-close-button";
    }
    if (currentStatus === FLOW_STATUS.ERROR && index === 1) {
      return "send-confirmation-retry-button";
    }
    return "send-confirmation-action-button";
  };

  return (
    <DialogFooter className="px-6">
      <div className="mb-12 flex w-full flex-col">
        {buttonsToRender.map(({ label, onClick, appearance }, index) => (
          <Button
            key={index}
            className={index === 0 ? "mb-16" : ""}
            appearance={appearance}
            size="lg"
            isFull
            onClick={onClick}
            data-testid={getButtonTestId(status, index)}
          >
            {label}
          </Button>
        ))}
      </div>
    </DialogFooter>
  );
};
