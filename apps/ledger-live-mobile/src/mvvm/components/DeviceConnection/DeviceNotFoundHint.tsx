import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type DeviceNotFoundHintProps = {
  /** Opens the add flow. Without it, the button is disabled. */
  onAddNewDevice?: () => void;
};

/** Shown while waiting for a known device that does not show up: offers to add another device. */
export function DeviceNotFoundHint({
  onAddNewDevice,
}: Readonly<DeviceNotFoundHintProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Banner
      appearance="info"
      title={t("connectKnownOrNewDevice.waitingHint.title")}
      primaryAction={
        <Button
          appearance="gray"
          size="sm"
          disabled={!onAddNewDevice}
          onPress={onAddNewDevice}
          lx={{ flexShrink: 1 }}
        >
          {t("connectKnownOrNewDevice.addDevice")}
        </Button>
      }
    />
  );
}
