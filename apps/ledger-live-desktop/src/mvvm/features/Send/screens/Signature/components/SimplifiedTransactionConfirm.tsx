import React from "react";
import { useTranslation } from "react-i18next";
import type { Device } from "@ledgerhq/types-devices";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getProductName } from "LLD/utils/getProductName";

type SimplifiedTransactionConfirmProps = Readonly<{
  device: Device | null | undefined;
}>;

export const SimplifiedTransactionConfirm = ({ device }: SimplifiedTransactionConfirmProps) => {
  const { t } = useTranslation();
  const type = useTheme().theme;

  if (!device) return null;

  return (
    <div className="flex flex-col items-center gap-24 px-24 pb-16 text-center">
      <DeviceBlocker />
      <Animation animation={getDeviceAnimation(device.modelId, type, "verify")} />
      <h2 className="text-base heading-3-semi-bold">
        {t("newSendFlow.sign.title", { wording: getProductName(device.modelId) })}
      </h2>
      <p className="text-muted body-2">{t("newSendFlow.sign.description")}</p>
    </div>
  );
};
