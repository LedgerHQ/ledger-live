import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { useTranslation } from "~/context/Locale";
import { useBootloaderDiscoveredViewModel } from "./useBootloaderDiscoveredViewModel";

type BootloaderDiscoveredProps = Readonly<{ device: Device }>;

export function BootloaderDiscovered({ device }: BootloaderDiscoveredProps) {
  const { t } = useTranslation();
  const { onContinue } = useBootloaderDiscoveredViewModel(device);

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
