import React from "react";
import { useTranslation } from "react-i18next";
import type { Device } from "@ledgerhq/types-devices";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type SimplifiedTransactionConfirmProps = Readonly<{
  device: Device;
}>;

export const SimplifiedTransactionConfirm = ({ device }: SimplifiedTransactionConfirmProps) => {
  const { t } = useTranslation();
  const type = useTheme().theme;

  if (!device) return null;

  return (
    <div className="flex flex-col items-center gap-24 px-24 pb-16">
      <DeviceBlocker />
      <Animation animation={getDeviceAnimation(device.modelId, type, "verify")} />
      <h2 className="text-center text-base heading-3-semi-bold">{t("sign.description")}</h2>
    </div>
  );
};
