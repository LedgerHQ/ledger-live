import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { CardTopUpAmountView } from "@features/flow-pay-card-top-up";
import { DialogBackgroundToneProvider, InfoState } from "@shared/ui-info-state";
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
      <DialogBackgroundToneProvider>
        <DialogHeader density="compact" onClose={amountView.onClose} className="!mb-0" />
        <DialogBody className="!mb-0 flex min-h-0 flex-col px-24 pb-24">
          <InfoState
            preset="success"
            size="hug"
            title={t(`${KEY_PREFIX}.successTitle`)}
            description={t(`${KEY_PREFIX}.successDescription`)}
            primaryCta={{
              label: t(`${KEY_PREFIX}.done`),
              onPress: amountView.onClose,
              testID: "card-top-up-done",
            }}
          />
        </DialogBody>
      </DialogBackgroundToneProvider>
    );
  }

  return <CardTopUpAmountView {...amountView} />;
}
