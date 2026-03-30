import React from "react";
import { DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import Animation from "~/renderer/animations";
import { AnimationWrapper, Title, SubTitle } from "~/renderer/components/DeviceAction/rendering";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import DeviceAction from "~/renderer/components/DeviceAction";
import type { PerpsSignViewModel } from "./usePerpsSignViewModel";

export function PerpsSignView({
  phase,
  theme,
  device,
  productName,
  action,
  request,
  t,
  handleDeviceResult,
}: PerpsSignViewModel) {
  if (phase === "sign" && device) {
    return (
      <>
        <DialogHeader />
        <DialogBody className="flex flex-col items-center gap-8 py-20 px-20">
          <DeviceBlocker />
          <AnimationWrapper>
            <Animation animation={getDeviceAnimation(device.modelId, theme, "sign")} />
          </AnimationWrapper>
          {device.deviceName ? (
            <span className="caption-1-semi-bold text-muted px-10 py-4 border border-neutral-c40 rounded-full">
              {device.deviceName}
            </span>
          ) : null}
          <div className="flex flex-col items-center gap-8 mt-4">
            <Title>{t("SignMessageConfirm.title", { wording: productName })}</Title>
            <SubTitle>{t("SignMessageConfirm.description")}</SubTitle>
          </div>
        </DialogBody>
      </>
    );
  }

  return (
    <>
      <DialogHeader />
      <DialogBody className="flex items-center justify-center px-32">
        <DeviceAction action={action} request={request} onResult={handleDeviceResult} />
      </DialogBody>
    </>
  );
}
