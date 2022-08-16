import React, { useCallback, useEffect, useState } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";
import { StackScreenProps } from "@react-navigation/stack";
import { Flex, InfiniteLoader, Text, Button } from "@ledgerhq/native-ui";
import {
  ArrowLeftMedium,
  BluetoothMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BleErrorCode } from "react-native-ble-plx";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { ScannedDevice } from "@ledgerhq/live-common/ble/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { useTranslation } from "react-i18next";

import { knownDevicesSelector } from "../../reducers/ble";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";
import OnboardingView from "../Onboarding/OnboardingView";
import DeviceItem from "../../components/SelectDevice/DeviceItem";
import TransportBLE from "../../react-native-hw-transport-ble";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "../../constants";
import RequiresBLE from "../../components/RequiresBLE";
import LocationRequired from "../LocationRequired";
import BleDeviceItem from "./BleDeviceItem";

const BluetoothThingy = () => (
  <Flex borderRadius="9999px" backgroundColor="#0082FC4D" padding={3}>
    <Flex borderRadius="9999px" backgroundColor="#0082FC4D" padding={4}>
      <Flex borderRadius="9999px" backgroundColor="#0082FC4D" padding={3}>
        <BluetoothMedium size={48} />
      </Flex>
    </Flex>
  </Flex>
);

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "BleDevicesScanning"
>;

export const BleDeviceScanning = ({ navigation, route }: Props) => {
  const { t } = useTranslation();

  // const { filterByModelId } = route.params;
  const [locationDisabledError, setLocationDisabledError] = useState<boolean>(
    false,
  );
  const [locationUnauthorizedError, setLocationUnauthorizedError] = useState<
    boolean
  >(false);
  const [stopBleScanning, setStopBleScanning] = useState<boolean>(false);

  // const knownDeviceIds = useSelector(knownDevicesSelector).map((device) => device.id);

  const { scannedDevices, scanningBleError } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
    stopBleScanning,
  });

  // Handles scanning error
  useEffect(() => {
    if (scanningBleError) {
      // Currently using the error code values from react-native-ble-plx
      // It should be defined indenpendently, in live-common
      if (
        scanningBleError?.errorCode === BleErrorCode.LocationServicesDisabled
      ) {
        setStopBleScanning(true);
        setLocationDisabledError(true);
      }

      if (scanningBleError?.errorCode === BleErrorCode.BluetoothUnauthorized) {
        setStopBleScanning(true);
        setLocationUnauthorizedError(true);
      }
    }
  }, [scanningBleError]);

  const handleNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onSelect = useCallback(
    (item: ScannedDevice, _deviceMeta) => {
      const deviceToPair = {
        deviceId: item.deviceId,
        deviceName: item.deviceName,
        modelId: item.deviceModel.id,
        wired: false,
      };
      // Replace to avoid going back to this screen without re-rendering
      // to make sure the list of scanning devices is reset
      navigation.replace(ScreenName.BleDevicePairing as "BleDevicePairing", {
        deviceToPair,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ScannedDevice }) => {
      const deviceMeta = {
        deviceId: item.deviceId,
        deviceName: `${item.deviceName}`,
        wired: false,
        modelId: item.deviceModel.id,
      };

      return (
        <BleDeviceItem
          deviceMeta={deviceMeta}
          onSelect={() => onSelect(item, deviceMeta)}
        />
      );
    },
    [onSelect],
  );

  const onLocationFixed = useCallback(() => {
    setLocationDisabledError(false);
    setLocationUnauthorizedError(false);
    setStopBleScanning(false);
  }, [setLocationDisabledError, setLocationUnauthorizedError]);

  if (locationDisabledError) {
    return <LocationRequired onRetry={onLocationFixed} errorType="disabled" />;
  }

  if (locationUnauthorizedError) {
    return (
      <LocationRequired onRetry={onLocationFixed} errorType="unauthorized" />
    );
  }

  return (
    <RequiresBLE>
      <SafeAreaView>
        <Flex bg="background.main" height="100%">
          <Flex flexDirection="row" justifyContent="space-between">
            <Button
              Icon={ArrowLeftMedium}
              size="medium"
              onPress={handleNavigateBack}
            />
          </Flex>

          <Flex px={4}>
            <Flex mb={8} alignItems="center">
              <BluetoothThingy />
            </Flex>
            <Text mb={3} textAlign="center" variant="h4" fontWeight="semiBold">
              {t("syncOnboarding.scanning.title", {
                productName: "Nano", // TODO
              })}
            </Text>
            <Text
              mb={8}
              color="neutral.c70"
              textAlign="center"
              variant="body"
              fontWeight="medium"
            >
              {t("syncOnboarding.scanning.description", {
                productName: "Nano", // TODO
              })}
            </Text>
            <FlatList
              data={scannedDevices}
              renderItem={renderItem}
              keyExtractor={item => `${item.deviceId}-${Math.random()}`}
              ListEmptyComponent={<InfiniteLoader size={58} />}
            />
          </Flex>
        </Flex>
      </SafeAreaView>
    </RequiresBLE>
  );
};
