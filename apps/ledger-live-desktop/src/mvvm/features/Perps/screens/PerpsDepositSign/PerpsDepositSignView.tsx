import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider, InfoState } from "@shared/ui-info-state";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderLoading } from "~/renderer/components/DeviceAction/rendering";
import TranslatedError from "~/renderer/components/TranslatedError";
import { PerpsDepositConfirmation } from "./components/PerpsDepositConfirmation";
import type { PerpsDepositSignViewModel } from "./usePerpsDepositSignViewModel";

type PerpsDepositSignViewProps = Readonly<PerpsDepositSignViewModel>;

export function PerpsDepositSignView({
  deviceStep,
  retry,
  onDismiss,
  onDeviceError,
}: PerpsDepositSignViewProps) {
  const { t } = useTranslation();

  if (deviceStep.kind === "error")
    return (
      <DialogBackgroundToneProvider>
        <DialogTitle className="sr-only">{t("perpsDepositSign.a11yTitle")}</DialogTitle>
        <DialogHeader density="compact" onClose={onDismiss} className="!mb-0" />
        <DialogBody className="flex min-h-0 flex-col px-24 pb-24">
          <InfoState
            preset="error"
            size="hug"
            title={<TranslatedError error={deviceStep.error} field="title" />}
            description={<TranslatedError error={deviceStep.error} field="description" />}
            primaryCta={{
              label: t("common.retry"),
              onPress: retry,
              testID: "perps-deposit-sign-retry",
            }}
          />
        </DialogBody>
      </DialogBackgroundToneProvider>
    );

  if (deviceStep.kind !== "device") return renderLoading();

  return (
    <>
      <DialogTitle className="sr-only">{t("perpsDepositSign.a11yTitle")}</DialogTitle>

      <DialogBody className="flex w-full flex-col items-center gap-24 px-16 pb-24 pt-24">
        {deviceStep.withDeviceAction(({ action, request, onResult }) => (
          <DeviceAction
            key={deviceStep.stepId}
            action={action}
            request={request}
            onResult={onResult}
            onError={onDeviceError}
            renderExchangeConfirmation={
              deviceStep.stepId === "confirm" ? () => <PerpsDepositConfirmation /> : undefined
            }
          />
        ))}
      </DialogBody>
    </>
  );
}
