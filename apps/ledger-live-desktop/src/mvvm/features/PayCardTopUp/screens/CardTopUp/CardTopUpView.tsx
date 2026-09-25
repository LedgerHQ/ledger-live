import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { Button, DialogBody, DialogFooter, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { CardTopUpAmountView } from "@features/flow-pay-card-top-up";
import { useTranslation } from "react-i18next";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderError, renderLoading } from "~/renderer/components/DeviceAction/rendering";
import type { CardTopUpViewModel } from "./types";

const KEY_PREFIX = "payTab.cardTopUp";

export function CardTopUpView({
  deviceStep,
  onRetry,
  onDeviceError,
  ...amountView
}: CardTopUpViewModel) {
  const { t } = useTranslation();

  if (deviceStep.kind === "error") {
    return renderError({ error: deviceStep.error, t, onRetry });
  }

  if (deviceStep.kind === "processing") {
    return renderLoading();
  }

  if (deviceStep.kind === "device") {
    return (
      <>
        <DialogTitle className="sr-only">{t(`${KEY_PREFIX}.deviceTitle`)}</DialogTitle>
        <DialogBody className="flex w-full flex-col items-center gap-24 px-16 pb-24 pt-24">
          {deviceStep.withDeviceAction(({ action, request, onResult }) => (
            <DeviceAction
              key={deviceStep.stepId}
              action={action}
              request={request}
              onResult={onResult}
              onError={onDeviceError}
            />
          ))}
        </DialogBody>
      </>
    );
  }

  if (deviceStep.kind === "success") {
    return (
      <>
        <DialogHeader
          density="compact"
          title={t(`${KEY_PREFIX}.successTitle`)}
          onClose={amountView.onClose}
        />
        <DialogBody>
          <p className="body-2 text-muted">{t(`${KEY_PREFIX}.successDescription`)}</p>
        </DialogBody>
        <DialogFooter>
          <Button className="w-full" onClick={amountView.onClose}>
            {t(`${KEY_PREFIX}.done`)}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return <CardTopUpAmountView {...amountView} />;
}
