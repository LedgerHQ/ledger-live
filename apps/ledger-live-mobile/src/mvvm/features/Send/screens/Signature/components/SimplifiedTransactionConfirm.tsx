import React from "react";
import { getProductName } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { useTranslation } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";

type SimplifiedTransactionConfirmProps = Readonly<{
  deviceModelId: DeviceModelId;
}>;

export function SimplifiedTransactionConfirm({ deviceModelId }: SimplifiedTransactionConfirmProps) {
  const { t } = useTranslation();
  const productName = getProductName(deviceModelId);

  return (
    <DeviceActionContent
      action="continue"
      description={t("send.newSendFlow.sign.description")}
      deviceModelId={deviceModelId}
      testID="send-signature-prompt"
      title={t("send.newSendFlow.sign.title", { wording: productName })}
    />
  );
}
