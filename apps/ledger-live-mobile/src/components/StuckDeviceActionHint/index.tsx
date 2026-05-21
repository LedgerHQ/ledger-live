import React from "react";
import { Alert as BaseAlert, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";

export function StuckDeviceActionHint() {
  const { t } = useTranslation();
  return (
    <Flex testID="device-action-stuck-loader-hint" width="100%" mt={6}>
      <BaseAlert type="secondary" title={t("DeviceAction.stuckLoaderHint")} />
    </Flex>
  );
}
