import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BluetoothRequired } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import SelectDevice from "~/components/SelectDevice";
import RemoveDeviceMenu from "~/components/SelectDevice2/RemoveDeviceMenu";
import TrackScreen from "~/analytics/TrackScreen";
import { track } from "~/analytics";
import NavigationScrollView from "~/components/NavigationScrollView";
import DeviceActionModal from "~/components/DeviceActionModal";
import {
  BaseComposite,
  ReactNavigationHeaderOptions,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "~/components/RootNavigator/types/ManagerNavigator";
import ServicesWidget from "~/components/ServicesWidget";

import { useManagerDeviceAction } from "~/hooks/deviceActions";

type NavigationProps = BaseComposite<
  StackNavigatorProps<ManagerNavigatorStackParamList, ScreenName.Manager>
>;

type Props = NavigationProps;

// Defines here some of the header options for this screen to be able to reset back to them.
export const managerHeaderOptions: ReactNavigationHeaderOptions = {
  headerShown: false,
};

type ChooseDeviceProps = Props & {
  isFocused: boolean;
};

const ChooseDevice: React.FC<ChooseDeviceProps> = ({ isFocused }) => {
  const action = useManagerDeviceAction();
  const [device, setDevice] = useState<Device | null>();

  const [chosenDevice, setChosenDevice] = useState<Device | null>();
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isHeaderOverridden, setIsHeaderOverridden] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { params } = useRoute<NavigationProps["route"]>();

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onSelectDevice = (device?: Device) => {
    if (device)
      track("ManagerDeviceEntered", {
        modelId: device.modelId,
      });
    setDevice(device);
  };

  const onShowMenu = (device: Device) => {
    setChosenDevice(device);
    setShowMenu(true);
  };

  const onHideMenu = () => setShowMenu(false);

  const onSelect = (result: Result) => {
    setDevice(undefined);

    if (result && "result" in result) {
      // FIXME: nullable stuff not taken into account here?
      // `result` overrides values from `params` (prop `device` for ex)
      // @ts-expect-error Result has nullable fields
      navigation.navigate(ScreenName.ManagerMain, {
        ...params,
        ...result,
        searchQuery: params?.searchQuery || params?.installApp,
      });
    }
  };

  const onModalHide = () => {
    setDevice(undefined);
  };

  const onError = (error: Error) => {
    // Both the old (SelectDevice) and new (SelectDevice2) device selection components handle the bluetooth requirements with a hook + bottom drawer.
    // By setting back the device to `undefined` it gives back the responsibilities to those select components to check for the bluetooth requirements
    // and avoids a duplicated error drawers/messages.
    // The only drawback: the user has to select again their device once the bluetooth requirements are respected.
    if (error instanceof BluetoothRequired) {
      setDevice(undefined);
    }
  };

  useEffect(() => {
    setDevice(params?.device);
  }, [params]);

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
          title: "",
        });
        setIsHeaderOverridden(true);
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions({
          headerLeft: () => null,
          headerRight: () => null,
          ...managerHeaderOptions,
        });
        setIsHeaderOverridden(false);
      }
    },
    [navigation],
  );

  if (!isFocused) return null;

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="Manager" name="ChooseDevice" />
      {!isHeaderOverridden ? (
        <Flex px={16} pb={8}>
          <Text pt={3} fontWeight="semiBold" variant="h4" testID="manager-title">
            <Trans i18nKey="manager.title" />
          </Text>
        </Flex>
      ) : null}

      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex flex={1} px={16}>
          <SelectDevice2
            onSelect={onSelectDevice}
            stopBleScanning={!!device}
            displayServicesWidget
            requestToSetHeaderOptions={requestToSetHeaderOptions}
            withMyLedgerTracking
            hasPostOnboardingEntryPointCard
          />
        </Flex>
      ) : (
        <NavigationScrollView contentContainerStyle={styles.scrollContainer}>
          <SelectDevice
            usbOnly={params?.firmwareUpdate}
            autoSelectOnAdd
            onSelect={onSelectDevice}
            onBluetoothDeviceAction={onShowMenu}
          />
          {chosenDevice ? (
            <RemoveDeviceMenu
              open={showMenu}
              device={chosenDevice as Device}
              onHideMenu={onHideMenu}
            />
          ) : null}
          <ServicesWidget />
        </NavigationScrollView>
      )}
      <DeviceActionModal
        onClose={() => onSelectDevice()}
        device={device}
        onResult={onSelect}
        onModalHide={onModalHide}
        action={action}
        request={null}
        onError={onError}
      />
    </TabBarSafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: "space-between",
  },
});

export default function Screen(props: Props) {
  const isFocused = useIsFocused();

  return <ChooseDevice {...props} isFocused={isFocused} />;
}
