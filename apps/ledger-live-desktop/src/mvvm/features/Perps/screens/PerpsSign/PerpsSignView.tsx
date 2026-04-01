import React from "react";
import { DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import Animation from "~/renderer/animations";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import DeviceAction from "~/renderer/components/DeviceAction";
import type { PerpsSignViewModel } from "./usePerpsSignViewModel";

export function PerpsSignView({
  phase,
  closing,
  theme,
  device,
  productName,
  action,
  request,
  t,
  handleDeviceResult,
  handleDeviceError,
}: PerpsSignViewModel) {
  if (phase === "sign" && device) {
    return (
      <>
        <DialogHeader />
        <DialogBody className="flex flex-col items-center gap-24 px-24 pb-16 text-center">
          <DeviceBlocker />
          <Animation animation={getDeviceAnimation(device.modelId, theme, "sign")} />
          {device.deviceName ? (
            <span className="caption-1-semi-bold text-muted px-10 py-4 border border-neutral-c40 rounded-full">
              {device.deviceName}
            </span>
          ) : null}
          <h2 className="heading-3-semi-bold text-base">
            {t("SignMessageConfirm.title", { wording: productName })}
          </h2>
          <p className="body-2 text-muted">{t("SignMessageConfirm.description")}</p>
        </DialogBody>
      </>
    );
  }

  return (
    <>
      <DialogHeader />
      <DialogBody
        className={`flex items-center justify-center px-32 ${closing ? "invisible" : ""}`}
      >
        <DeviceAction
          action={action}
          request={request}
          onResult={handleDeviceResult}
          onError={handleDeviceError}
        />
      </DialogBody>
    </>
  );
}
