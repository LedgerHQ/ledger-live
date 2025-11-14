import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex } from "@ledgerhq/native-ui";
import DeviceItem from "./DeviceItem";
import { type DisplayedDevice } from "./DisplayedDevice";

const MAX_LEDGERS_DISPLAYED = 3;

type Props = {
  readonly deviceList: DisplayedDevice[];
  readonly handleOnSelect: (device: DisplayedDevice) => void;
};
export function DeviceList({ deviceList, handleOnSelect }: Props) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const hasMoreOrLessButton = deviceList.length > MAX_LEDGERS_DISPLAYED;
  return (
    <Flex>
      {deviceList.slice(0, showAll ? deviceList.length : MAX_LEDGERS_DISPLAYED).map((device, i) => (
        <DeviceItem
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
