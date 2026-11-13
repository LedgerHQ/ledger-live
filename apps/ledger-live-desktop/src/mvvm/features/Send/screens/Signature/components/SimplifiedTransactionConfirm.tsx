import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Device, DeviceModelId } from "@ledgerhq/types-devices";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getProductName } from "LLD/utils/getProductName";

type SimplifiedTransactionConfirmProps = Readonly<{
  device?: Device | null;
  /** For callers that only know the model, such as the device intent executor. */
  deviceModelId?: DeviceModelId | null;
  title?: string;
  onShown?: () => void;
}>;

export const SimplifiedTransactionConfirm = ({
  device,
  deviceModelId: deviceModelIdProp,
  title,
  onShown,
}: SimplifiedTransactionConfirmProps) => {
  const deviceModelId = deviceModelIdProp ?? device?.modelId;
  const { t } = useTranslation();
  const type = useTheme().theme;

  const hasTrackedRef = useRef(false);
  if (deviceModelId && !hasTrackedRef.current) {
    hasTrackedRef.current = true;
    onShown?.();
  }

  if (!deviceModelId) return null;

  return (
    <div
      className="flex flex-col items-center gap-24 px-24 pb-16 text-center"
      data-testid="send-signature-prompt"
    >
      <DeviceBlocker />
      <Animation animation={getDeviceAnimation(deviceModelId, type, "verify")} />
      <h2 className="heading-3-semi-bold text-base" data-testid="send-signature-title">
        {title ?? t("newSendFlow.sign.title", { wording: getProductName(deviceModelId) })}
      </h2>
      <p className="body-2 text-muted">{t("newSendFlow.sign.description")}</p>
    </div>
  );
};
