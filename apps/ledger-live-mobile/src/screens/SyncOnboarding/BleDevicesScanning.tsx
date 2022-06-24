import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";
import { StackScreenProps } from "@react-navigation/stack";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import { useBleDevicesScanning } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicesScanning";
import type { ScannedDevice } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicesScanning";
import { DeviceModelId } from "@ledgerhq/devices";
import { knownDevicesSelector } from "../../reducers/ble";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";
import OnboardingView from "../Onboarding/OnboardingView";
import DeviceItem from "../../components/SelectDevice/DeviceItem";
import TransportBLE from "../../react-native-hw-transport-ble";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "../../constants";

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "BleDevicesScanning"
>;

export const BleDeviceScanning = ({ navigation, route }: Props) => {
  // const { t } = useTranslation();

  // const { filterByModelId } = route.params; 

  // const knownDeviceIds = useSelector(knownDevicesSelector).map((device) => device.id);
  // const setupNanoFTS = useCallback(() => {
  //   navigation.navigate(ScreenName.SyncOnboardingCompanion, { pairedDevice: null });
  // }, [navigation]);

  const { scannedDevices } = useBleDevicesScanning({ bleTransportListen: TransportBLE.listen });

  const onSelect = useCallback((_item, deviceMeta) => {
    console.log(`🥹 Selected device ${deviceMeta}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ScannedDevice }) => {
      const deviceMeta = {
        deviceId: item.deviceId,
        deviceName: `${item.deviceName}, a ${item.deviceModel.id} with a signal ${item.bleRssi}`,
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

  return (
    <OnboardingView
      hasBackButton
      title="Pair a nanoFTS"
    >
      <FlatList
        data={scannedDevices}
        renderItem={renderItem}
        keyExtractor={item => `${item.deviceId}-${Math.random()}`}
        ListEmptyComponent={<InfiniteLoader size={58} />}
      />
    </OnboardingView>
  );
}

