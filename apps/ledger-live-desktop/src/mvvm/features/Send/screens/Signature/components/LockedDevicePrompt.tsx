import React from "react";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Button } from "@ledgerhq/lumen-ui-react";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type LockedDevicePromptProps = Readonly<{
  deviceModelId: DeviceModelId;
  onRetry?: (() => void) | null | undefined;
}>;

export const LockedDevicePrompt = ({ deviceModelId, onRetry }: LockedDevicePromptProps) => {
  const { t } = useTranslation();
  const theme = useTheme().theme;
  const deviceName = getDeviceModel(deviceModelId).productName;

  return (
    <>
      <DeviceBlocker />
      <div className="flex h-full flex-col items-center justify-center gap-24 px-24 pb-16">
        <Animation animation={getDeviceAnimation(deviceModelId, theme, "enterPinCode")} />
        <div className="flex flex-col items-center gap-12">
          <h2 className="text-center heading-3-semi-bold text-base">
            {t("errors.LockedDeviceError.descriptionWithProductName", { productName: deviceName })}
          </h2>
        </div>
        {onRetry ? (
          <Button appearance="base" size="lg" onClick={onRetry} className="w-full">
            {t("common.retry")}
          </Button>
        ) : null}
      </div>
    </>
  );
};
