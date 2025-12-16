import React, { useCallback, useEffect, useState } from "react";
import { Linking, FlatList } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { IconsLegacy } from "@ledgerhq/native-ui";
import Animation from "../Animation";
import BleDeviceItem from "./BleDeviceItem";
import Link from "~/components/wrappedUi/Link";
import { useLottieAsset } from "~/utils/lottieAsset";

const lottieAsset = require("./assets/bluetooth.lottie.json");
import { urls } from "~/utils/urls";
import { TrackScreen, track } from "~/analytics";
import { ScannedDevice } from "@ledgerhq/live-dmk-mobile";
import { useOrderedBleScannedDevices } from "./hooks/useOrderedBleScannedDevices";

export type FilterByDeviceModelId = null | DeviceModelId;
const CANT_SEE_DEVICE_TIMEOUT = 5000;

export type BleDevicesScanningProps = {
  devices: ScannedDevice[];
  onDeviceSelect: (item: ScannedDevice) => void;
  filterByDeviceModelId?: FilterByDeviceModelId | FilterByDeviceModelId[];
  areKnownDevicesDisplayed?: boolean;
  areKnownDevicesPairable?: boolean;
};

export const BleDevicesScanning: React.FC<BleDevicesScanningProps> = ({
  devices,
  onDeviceSelect,
  filterByDeviceModelId = null,
  areKnownDevicesPairable,
}: BleDevicesScanningProps) => {
  const { t } = useTranslation();
  const lottie = useLottieAsset(lottieAsset);

  const productName =
    filterByDeviceModelId && !Array.isArray(filterByDeviceModelId)
      ? getDeviceModel(filterByDeviceModelId).productName || filterByDeviceModelId
      : null;

  const [isCantSeeDeviceShown, setIsCantSeeDeviceShown] = useState<boolean>(false);
  useEffect(() => {
    const cantSeeDeviceTimeout = setTimeout(
      () => setIsCantSeeDeviceShown(true),
      CANT_SEE_DEVICE_TIMEOUT,
    );

    return () => clearTimeout(cantSeeDeviceTimeout);
  }, []);

  const onCantSeeDevicePress = useCallback(() => {
    track("button_clicked", {
      button: "Can’t find device Bluetooth",
    });
    Linking.openURL(urls.pairingIssues);
  }, []);

  const { displayedDevices, knownDeviceIds } = useOrderedBleScannedDevices({
    devices,
    areKnownDevicesPairable,
  });

  return (
    <Flex flex={1}>
      <TrackScreen category={"Looking for device Bluetooth"} />
      <Flex flex={1} px={2}>
        <Flex py={16}>
          <Flex height={100} alignItems="center" justifyContent="center" mb={24}>
            <Animation style={{ width: 250 }} source={lottie} />
          </Flex>
          <Text mb={3} textAlign="center" variant="h4" fontWeight="semiBold" fontSize={24}>
            {productName
              ? t("blePairingFlow.scanning.withProductName.title", {
                  productName,
                })
              : t("blePairingFlow.scanning.withoutProductName.title")}
          </Text>
          <Text
            color="neutral.c70"
            variant="body"
            fontWeight="medium"
            style={{ marginHorizontal: 24, textAlign: "center" }}
          >
            {t("blePairingFlow.scanning.description")}
          </Text>
        </Flex>

        <Flex flex={1} py={16}>
          <FlatList
            data={displayedDevices}
            contentContainerStyle={{ paddingBottom: 10 }}
            extraData={{ knownDeviceIds }}
            keyExtractor={item => item.deviceId}
            renderItem={({ item }) => (
              <BleDeviceItem
                onSelect={() => onDeviceSelect(item)}
                deviceMeta={{
                  deviceId: item.deviceId,
                  deviceName: item.deviceName,
                  wired: false,
                  modelId: item.modelId,
                  isAlreadyKnown: item.isAlreadyKnown,
                  grayedOut: item.grayedOut,
                }}
                areKnownDevicesPairable={false}
              />
            )}
          />
        </Flex>
      </Flex>
      {productName !== null && isCantSeeDeviceShown && (
        <Flex pb={16}>
          <Link
            onPress={onCantSeeDevicePress}
            size={"medium"}
            Icon={IconsLegacy.HelpMedium}
            type="shade"
            iconPosition="right"
          >
            {t("blePairingFlow.scanning.cantSeeDevice", { productName })}
          </Link>
        </Flex>
      )}
    </Flex>
  );
};
