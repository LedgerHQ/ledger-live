import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { renderError, renderLoading } from "~/renderer/components/DeviceAction/rendering";
import type { PerpsDepositSignViewModel } from "./usePerpsDepositSignViewModel";

type PerpsDepositSignViewProps = Readonly<PerpsDepositSignViewModel>;

export function PerpsDepositSignView({ deviceStep, retry }: PerpsDepositSignViewProps) {
  const { t } = useTranslation();

  // A result-variant error (user cancel / refusal / business failure) that
  // <DeviceAction> hands back to us — show its own error screen, with retry.
  if (deviceStep.kind === "error")
    return renderError({ error: deviceStep.error, t, onRetry: retry });

  // Off-device phases (quote / payload fetch / broadcast) have no device action to
  // render, so we show <DeviceAction>'s own loader for a consistent look.
  if (deviceStep.kind !== "device") return renderLoading();

  return (
    <>
      <DialogTitle className="sr-only">{t("perpsDepositSign.a11yTitle")}</DialogTitle>

      <DialogBody>
        <div className="flex w-full flex-col items-center gap-24 px-16 pb-24 pt-24">
          {deviceStep.withDeviceAction(({ action, request, onResult }) => (
            <DeviceAction
              key={deviceStep.stepId}
              action={action}
              request={request}
              onResult={onResult}
              isPerpsConfirmation={deviceStep.isPerpsConfirmation}
            />
          ))}
        </div>
      </DialogBody>
    </>
  );
}
