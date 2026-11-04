import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderLoading } from "~/renderer/components/DeviceAction/rendering";
import TranslatedError from "~/renderer/components/TranslatedError";
import { PerpsDepositConfirmation } from "../PerpsDepositSign/components/PerpsDepositConfirmation";
import type { PerpsWithdrawSignViewModel } from "./usePerpsWithdrawSignViewModel";

export function PerpsWithdrawSignView({
  step,
  attempt,
  action,
  request,
  handleDeviceResult,
  handleDeviceError,
  retry,
  onDismiss,
}: Readonly<PerpsWithdrawSignViewModel>) {
  const { t } = useTranslation();
  const title = <DialogTitle className="sr-only">{t("perpsWithdrawSign.a11yTitle")}</DialogTitle>;

  if (step.kind === "error")
    return (
      <DialogBackgroundToneProvider>
        {title}
        <DialogHeader density="compact" onClose={onDismiss} className="!mb-0" />
        <DialogBody className="flex min-h-0 flex-col px-24 pb-24">
          <InfoState
            preset="error"
            size="hug"
            title={<TranslatedError error={step.error} field="title" />}
            description={<TranslatedError error={step.error} field="description" />}
            primaryCta={
              step.canRetry
                ? { label: t("common.retry"), onPress: retry, testID: "perps-withdraw-sign-retry" }
                : {
                    label: t("common.close"),
                    onPress: onDismiss,
                    testID: "perps-withdraw-sign-close",
                  }
            }
          />
        </DialogBody>
      </DialogBackgroundToneProvider>
    );

  if (step.kind === "submitting")
    return (
      <>
        {title}
        {renderLoading()}
      </>
    );

  return (
    <>
      {title}
      <DialogBody className="flex w-full flex-col items-center gap-24 px-16 pb-24 pt-24">
        {step.kind === "sign" ? (
          <PerpsDepositConfirmation />
        ) : (
          <DeviceAction
            key={attempt}
            action={action}
            request={request}
            onResult={handleDeviceResult}
            onError={handleDeviceError}
            onOpenManager={onDismiss}
          />
        )}
      </DialogBody>
    </>
  );
}
