import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { useTranslation } from "@shared/i18n";
import {
  useBootloaderDiscoveredViewModel,
  type BootloaderDiscoveredProps,
} from "./useBootloaderDiscoveredViewModel";

export function BootloaderDiscovered(props: BootloaderDiscoveredProps) {
  const { t } = useTranslation();
  const { onContinue } = useBootloaderDiscoveredViewModel(props);

  return (
    <InfoState
      preset="text"
      size="hug"
      title={t("osUpdates.bootloaderDiscovered.title")}
      description={t("osUpdates.bootloaderDiscovered.description")}
      primaryCta={{
        label: t("osUpdates.bootloaderDiscovered.continue"),
        onPress: onContinue,
      }}
      testID="os-update-bootloader-discovered"
    />
  );
}
