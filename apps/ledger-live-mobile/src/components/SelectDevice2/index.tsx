import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { CompositeScreenProps, useNavigation } from "@react-navigation/native";
import { Text, Flex, Icons, Box, ScrollContainer } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/usePostOnboardingEntryPointVisibleOnWallet";

import TransportBLE from "../../react-native-hw-transport-ble";
import { track } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";
import { knownDevicesSelector } from "../../reducers/ble";
import Touchable from "../Touchable";
import Item from "./Item";
import { saveBleDeviceName } from "../../actions/ble";
import { setHasConnectedDevice } from "../../actions/appstate";
import {
  setLastConnectedDevice,
  setReadOnlyMode,
} from "../../actions/settings";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "../RootNavigator/types/ManagerNavigator";
import { MainNavigatorParamList } from "../RootNavigator/types/MainNavigator";
import PostOnboardingEntryPointCard from "../PostOnboarding/PostOnboardingEntryPointCard";
import BleDevicePairingFlow from "../BleDevicePairingFlow";
import BuyDeviceCTA from "../BuyDeviceCTA";
import { useResetOnNavigationFocusState } from "../../helpers/useResetOnNavigationFocusState";
import { useDebouncedRequireBluetooth } from "../RequiresBLE/hooks/useRequireBluetooth";
import RequiresBluetoothDrawer from "../RequiresBLE/RequiresBluetoothDrawer";
import QueuedDrawer from "../QueuedDrawer";
import ServicesWidget from "../ServicesWidget";

type Navigation = BaseComposite<
  CompositeScreenProps<
    StackNavigatorProps<ManagerNavigatorStackParamList>,
    StackNavigatorProps<MainNavigatorParamList>
  >
>;

type Props = {
  onSelect: (_: Device) => void;
  // This component has side-effects because it uses a BLE scanning hook.
  // And the scanning can only occur when LLM is not communicating with a device.
  // Other component using this component needs to stop the BLE scanning before starting
  // to communicate to a device via BLE.
  stopBleScanning?: boolean;
  displayServicesWidget?: boolean;
};

export default function SelectDevice({
  onSelect,
  stopBleScanning,
  displayServicesWidget,
}: Props) {
  const [USBDevice, setUSBDevice] = useState<Device | undefined>();
  const [ProxyDevice, setProxyDevice] = useState<Device | undefined>();

  const dispatch = useDispatch();

  const [isAddNewDrawerOpen, setIsAddNewDrawerOpen] = useState<boolean>(false);
  const [isPairingDevices, setIsPairingDevices] = useState<boolean>(false);

  const postOnboardingVisible = usePostOnboardingEntryPointVisibleOnWallet();

  const { t } = useTranslation();

  const knownDevices = useSelector(knownDevicesSelector);
  const navigation = useNavigation<Navigation["navigation"]>();
  const { scannedDevices } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
    stopBleScanning,
  });

  // Each time the user navigates back to the screen the BLE requirements are not enforced
  const [isBleRequired, setIsBleRequired] = useResetOnNavigationFocusState(
    navigation,
    false,
  );

  // To be able to triggers the device selection once all the bluetooth requirements are respected
  const [
    lastSelectedDeviceBeforeRequireBluetoothCheck,
    setLastSelectedDeviceBeforeRequireBluetoothCheck,
  ] = useState<Device | null>(null);

  // Enforces the BLE requirements for a "connecting" action. The requirements are only enforced
  // if the bluetooth is needed (isBleRequired is true).
  const {
    bluetoothRequirementsState,
    retryRequestOnIssue,
    cannotRetryRequest,
  } = useDebouncedRequireBluetooth({
    requiredFor: "connecting",
    isHookEnabled: isBleRequired,
  });

  // If the user tries to close the drawer displaying issues on BLE requirements,
  // this cancels the requirements checking and does not do anything in order to stop the
  // connection with a device via BLE
  const onUserCloseRequireBluetoothDrawer = useCallback(() => {
    setIsBleRequired(false);
  }, [setIsBleRequired]);

  const handleOnSelect = useCallback(
    (device: Device) => {
      const { modelId, wired } = device;
      track("Device selection", {
        modelId,
        connectionType: wired ? "USB" : "BLE",
      });

      // If not wired, bluetooth is required
      if (!wired) {
        if (!isBleRequired) {
          setLastSelectedDeviceBeforeRequireBluetoothCheck(device);
          setIsBleRequired(true);
          return;
        }

        // Normally, if isBleRequired is true, and the user managed to click to select a device
        // then all the bluetooth requirements should be respected. But to be sure no UI glitch
        // happened, checks the bluetoothRequirementsState
        if (bluetoothRequirementsState !== "all_respected") {
          setLastSelectedDeviceBeforeRequireBluetoothCheck(device);
          return;
        }
      } else {
        setIsBleRequired(false);
      }

      setIsPairingDevices(false);

      dispatch(setLastConnectedDevice(device));
      dispatch(setHasConnectedDevice(true));
      onSelect(device);
      dispatch(setReadOnlyMode(false));
    },
    [
      bluetoothRequirementsState,
      dispatch,
      isBleRequired,
      onSelect,
      setIsBleRequired,
    ],
  );

  // Once all the bluetooth requirements are respected, the device selection is triggered
  useEffect(() => {
    if (
      bluetoothRequirementsState === "all_respected" &&
      lastSelectedDeviceBeforeRequireBluetoothCheck
    ) {
      handleOnSelect(lastSelectedDeviceBeforeRequireBluetoothCheck);
      setLastSelectedDeviceBeforeRequireBluetoothCheck(null);
    }
  }, [
    bluetoothRequirementsState,
    lastSelectedDeviceBeforeRequireBluetoothCheck,
    handleOnSelect,
  ]);

  useEffect(() => {
    const filter = ({ id }: { id: string }) =>
      ["hid", "httpdebug"].includes(id);
    const sub = discoverDevices(filter).subscribe(e => {
      const setDevice = e.id.startsWith("usb") ? setUSBDevice : setProxyDevice;

      if (e.type === "remove") setDevice(undefined);
      if (e.type === "add") {
        const { name, deviceModel, id, wired } = e;

        setDevice((maybeDevice: Device | undefined) => {
          return (
            maybeDevice ||
            ({
              deviceName: name,
              modelId: deviceModel?.id,
              deviceId: id,
              wired,
            } as Device)
          );
        });
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const deviceList = useMemo(() => {
    const devices: Device[] = knownDevices
      .map(device => {
        const equivalentScannedDevice = scannedDevices.find(
          ({ deviceId }) => device.id === deviceId,
        );

        return {
          ...device,
          wired: false,
          deviceId: device.id,
          deviceName: equivalentScannedDevice?.deviceName ?? device.name,
          available: Boolean(equivalentScannedDevice),
          // TODO add rsi strength from the BIM pr.
        } as Device & { available: boolean };
      })
      .sort((a, b) => Number(b.available) - Number(a.available));

    if (USBDevice) {
      devices.push(USBDevice);
    }
    if (ProxyDevice) {
      devices.push(ProxyDevice);
    }

    return devices;
  }, [knownDevices, scannedDevices, USBDevice, ProxyDevice]);

  // update device name on store when needed
  useEffect(() => {
    knownDevices.forEach(knownDevice => {
      const equivalentScannedDevice = scannedDevices.find(
        ({ deviceId }) => knownDevice.id === deviceId,
      );

      if (
        equivalentScannedDevice?.deviceName &&
        knownDevice.name !== equivalentScannedDevice.deviceName
      ) {
        dispatch(
          saveBleDeviceName({
            deviceId: knownDevice.id,
            name: equivalentScannedDevice?.deviceName,
          }),
        );
      }
    });
  }, [dispatch, knownDevices, scannedDevices]);

  const onAddNewPress = useCallback(() => setIsAddNewDrawerOpen(true), []);

  const openBlePairingFlow = useCallback(() => {
    setIsAddNewDrawerOpen(false);
    setIsPairingDevices(true);
  }, []);

  const closeBlePairingFlow = useCallback(() => {
    setIsPairingDevices(false);
    setIsAddNewDrawerOpen(false);
  }, []);

  const onSetUpNewDevice = useCallback(() => {
    setIsAddNewDrawerOpen(false);

    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
  }, [navigation]);

  return (
    <>
      <RequiresBluetoothDrawer
        isOpenedOnIssue={isBleRequired}
        onUserClose={onUserCloseRequireBluetoothDrawer}
        bluetoothRequirementsState={bluetoothRequirementsState}
        retryRequestOnIssue={retryRequestOnIssue}
        cannotRetryRequest={cannotRetryRequest}
      />
      <Flex flex={1}>
        {isPairingDevices ? (
          <BleDevicePairingFlow
            onPairingSuccess={handleOnSelect}
            onGoBackFromScanning={closeBlePairingFlow}
            onPairingSuccessAddToKnownDevices
          />
        ) : (
          <>
            {postOnboardingVisible && (
              <Box mb={8}>
                <PostOnboardingEntryPointCard />
              </Box>
            )}
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Text variant="h5" fontWeight="semiBold">
                <Trans i18nKey="manager.selectDevice.title" />
              </Text>
              {deviceList.length > 0 && (
                <Touchable onPress={onAddNewPress}>
                  <Flex flexDirection="row" alignItems="center">
                    <Text color="primary.c90" mr={3} fontWeight="semiBold">
                      <Trans
                        i18nKey={`manager.selectDevice.${
                          Platform.OS === "android"
                            ? "addWithBluetooth"
                            : "addNewCTA"
                        }`}
                      />
                    </Text>
                    <Icons.PlusMedium color="primary.c90" size={15} />
                  </Flex>
                </Touchable>
              )}
            </Flex>
            <ScrollContainer my={4}>
              {deviceList.length > 0 ? (
                deviceList.map(device => (
                  <Item
                    key={device.deviceId}
                    device={device as Device}
                    onPress={handleOnSelect}
                  />
                ))
              ) : (
                <Touchable onPress={onAddNewPress}>
                  <Flex
                    p={5}
                    mb={4}
                    borderRadius={5}
                    flexDirection="row"
                    alignItems="center"
                    borderColor="neutral.c40"
                    borderStyle="dashed"
                    borderWidth="1px"
                  >
                    <Icons.PlusMedium color="neutral.c90" size={20} />
                    <Text variant="large" fontWeight="semiBold" ml={5}>
                      {t(
                        `manager.selectDevice.${
                          Platform.OS === "android"
                            ? "addWithBluetooth"
                            : "addALedger"
                        }`,
                      )}
                    </Text>
                  </Flex>
                </Touchable>
              )}
              {Platform.OS === "android" &&
                USBDevice === undefined &&
                ProxyDevice === undefined && (
                  <Text
                    color="neutral.c100"
                    variant="large"
                    fontWeight="semiBold"
                    fontSize={4}
                    lineHeight="21px"
                  >
                    <Trans i18nKey="manager.selectDevice.otgBanner" />
                  </Text>
                )}
              {displayServicesWidget && <ServicesWidget />}
            </ScrollContainer>
            <Flex alignItems="center" mt={5}>
              <BuyDeviceCTA />
            </Flex>
            <QueuedDrawer
              isRequestingToBeOpened={isAddNewDrawerOpen}
              onClose={() => setIsAddNewDrawerOpen(false)}
            >
              <Flex>
                <Touchable onPress={onSetUpNewDevice}>
                  <Flex
                    backgroundColor="neutral.c30"
                    mb={4}
                    px={6}
                    py={7}
                    borderRadius={8}
                  >
                    <Flex flexDirection="row" justifyContent="space-between">
                      <Flex flexShrink={1}>
                        <Text variant="large" fontWeight="semiBold" mb={3}>
                          {t("manager.selectDevice.setUpNewLedger")}
                        </Text>
                        <Text variant="paragraph" color="neutral.c80">
                          {t("manager.selectDevice.setUpNewLedgerDescription")}
                        </Text>
                      </Flex>
                      <Flex
                        justifyContent="center"
                        alignItems="center"
                        ml={5}
                        mr={2}
                      >
                        <Flex
                          borderRadius="9999px"
                          backgroundColor="neutral.c40"
                          p={4}
                        >
                          <Icons.PlusMedium color="primary.c80" size={24} />
                        </Flex>
                      </Flex>
                    </Flex>
                  </Flex>
                </Touchable>
                <Touchable onPress={openBlePairingFlow}>
                  <Flex
                    backgroundColor="neutral.c30"
                    px={6}
                    py={7}
                    borderRadius={8}
                  >
                    <Flex flexDirection="row" justifyContent="space-between">
                      <Flex flexShrink={1}>
                        <Text variant="large" fontWeight="semiBold" mb={3}>
                          {t("manager.selectDevice.connectExistingLedger")}
                        </Text>
                        <Text variant="paragraph" color="neutral.c80">
                          {t(
                            "manager.selectDevice.connectExistingLedgerDescription",
                          )}
                        </Text>
                      </Flex>
                      <Flex
                        justifyContent="center"
                        alignItems="center"
                        ml={5}
                        mr={2}
                      >
                        <Flex
                          borderRadius="9999px"
                          backgroundColor="neutral.c40"
                          p={4}
                        >
                          <Icons.BluetoothMedium
                            color="primary.c80"
                            size={24}
                          />
                        </Flex>
                      </Flex>
                    </Flex>
                  </Flex>
                </Touchable>
              </Flex>
            </QueuedDrawer>
          </>
        )}
      </Flex>
    </>
  );
}
