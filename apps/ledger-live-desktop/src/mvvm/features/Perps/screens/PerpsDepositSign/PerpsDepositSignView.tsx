import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderError, renderLoading } from "~/renderer/components/DeviceAction/rendering";
import { PerpsDepositConfirmation } from "./components/PerpsDepositConfirmation";
import type { PerpsDepositSignViewModel } from "./usePerpsDepositSignViewModel";

type PerpsDepositSignViewProps = Readonly<PerpsDepositSignViewModel>;

export function PerpsDepositSignView({
  deviceStep,
  retry,
  onDeviceError,
}: PerpsDepositSignViewProps) {
  const { t } = useTranslation();

  if (deviceStep.kind === "error")
    return renderError({ error: deviceStep.error, t, onRetry: retry });

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
