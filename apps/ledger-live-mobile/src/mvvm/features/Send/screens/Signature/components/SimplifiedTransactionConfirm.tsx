import React from "react";
import { getProductName } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { useTranslation } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";

type SimplifiedTransactionConfirmProps = Readonly<{
  deviceModelId: DeviceModelId;
  /** Replaces the generic "Continue on your device" title. */
  title?: string;
}>;

export function SimplifiedTransactionConfirm({
  deviceModelId,
  title,
}: SimplifiedTransactionConfirmProps) {
  const { t } = useTranslation();

  return (
    <DeviceActionContent
      action="continue"
      description={t("send.newSendFlow.sign.description")}
      deviceModelId={deviceModelId}
      testID="send-signature-prompt"
      title={title ?? t("send.newSendFlow.sign.title", { wording: getProductName(deviceModelId) })}
    />
  );
}
