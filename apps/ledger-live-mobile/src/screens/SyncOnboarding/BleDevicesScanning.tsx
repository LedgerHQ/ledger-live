import React, { useCallback, useEffect, useState } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";
import { StackScreenProps } from "@react-navigation/stack";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import { BleErrorCode } from "react-native-ble-plx";
import { useBleDevicesScanning } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicesScanning";
import type { ScannedDevice } from "@ledgerhq/live-common/lib/ble/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { knownDevicesSelector } from "../../reducers/ble";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";
import OnboardingView from "../Onboarding/OnboardingView";
import DeviceItem from "../../components/SelectDevice/DeviceItem";
import TransportBLE from "../../react-native-hw-transport-ble";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "../../constants";
import RequiresBLE from "../../components/RequiresBLE";
import LocationRequired from "../LocationRequired";

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "BleDevicesScanning"
>;

export const BleDeviceScanning = ({ navigation, route }: Props) => {
  // const { t } = useTranslation();

  // const { filterByModelId } = route.params; 
  const [locationDisabledError, setLocationDisabledError] = useState<boolean>(false);
  const [locationUnauthorizedError, setLocationUnauthorizedError] = useState<boolean>(false);
  const [stopBleScanning, setStopBleScanning] = useState<boolean>(false);

  // const knownDeviceIds = useSelector(knownDevicesSelector).map((device) => device.id);
  // const setupNanoFTS = useCallback(() => {
  //   navigation.navigate(ScreenName.SyncOnboardingCompanion, { pairedDevice: null });
  // }, [navigation]);

  const { scannedDevices, scanningBleError } = useBleDevicesScanning({ bleTransportListen: TransportBLE.listen, stopBleScanning });

  // Handles scanning error
  useEffect(() => {
    if (scanningBleError) {
      // Currently using the error code values from react-native-ble-plx
      // It should be defined indenpendently, in live-common
      if (scanningBleError?.errorCode === BleErrorCode.LocationServicesDisabled) {
        setStopBleScanning(true);
        setLocationDisabledError(true);
      }

      if (scanningBleError?.errorCode === BleErrorCode.BluetoothUnauthorized) {
        setStopBleScanning(true);
        setLocationUnauthorizedError(true);
      }
    }
  }, [scanningBleError]);

  const onSelect = useCallback((item: ScannedDevice, _deviceMeta) => {
    const deviceToPair = {
        deviceId: item.deviceId,
        deviceName: item.deviceName,
        modelId: item.deviceModel.id,
        wired: false,
    };
    console.log(`🖖 Selected device = ${JSON.stringify(deviceToPair)}`);
    // Replace to avoid going back to this screen without re-rendering 
    // to make sure the list of scanning devices is reset
    navigation.replace(ScreenName.BleDevicePairing as "BleDevicePairing", { deviceToPair } );
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ScannedDevice }) => {
      const deviceMeta = {
        deviceId: item.deviceId,
        deviceName: `${item.deviceName}`,
        wired: false,
        modelId: item.deviceModel.id,
      };

      return (
        <DeviceItem
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

  if(locationUnauthorizedError) {
    return <LocationRequired onRetry={onLocationFixed} errorType="unauthorized" />;
  }

  return (
    <RequiresBLE>
      <OnboardingView
        hasBackButton
        title="Pair a nano"
      >
        <FlatList
          data={scannedDevices}
          renderItem={renderItem}
          keyExtractor={item => `${item.deviceId}-${Math.random()}`}
          ListEmptyComponent={<InfiniteLoader size={58} />}
        />
      </OnboardingView>
    </RequiresBLE>
  );
}

