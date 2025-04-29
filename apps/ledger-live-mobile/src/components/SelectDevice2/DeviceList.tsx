import { Device } from "@ledgerhq/live-common/hw/actions/types";
import React, { useState } from "react";
import Item from "./Item";
import { Button, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

const MAX_LEDGERS_DISPLAYED = 3;

type Props = {
  readonly deviceList: Device[];
  readonly handleOnSelect: (device: Device) => void;
};
export function DeviceList({ deviceList, handleOnSelect }: Props) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const hasMoreOrLessButton = deviceList.length > MAX_LEDGERS_DISPLAYED;
  return (
    <Flex>
      {deviceList.slice(0, showAll ? deviceList.length : MAX_LEDGERS_DISPLAYED).map((device, i) => (
        <Item
          key={`${device.deviceId}-${device.deviceName ?? "no-name"}-${i}`}
          device={device}
          onPress={handleOnSelect}
        />
      ))}
      {hasMoreOrLessButton && (
        <Button
          outline
          type="shade"
          size="large"
          onPress={() => setShowAll(prev => !prev)}
          iconName={!showAll ? "ChevronDown" : "ChevronUp"}
          iconPosition="right"
        >
          {!showAll
            ? t("manager.selectDevice.showAllCTA", { count: deviceList.length })
            : t("manager.selectDevice.showLessCTA")}
        </Button>
      )}
    </Flex>
  );
}
