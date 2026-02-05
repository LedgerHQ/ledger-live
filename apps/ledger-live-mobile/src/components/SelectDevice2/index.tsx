import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { useTranslation } from "~/context/Locale";
import Config from "react-native-config";
import { useSelector, useDispatch } from "~/context/hooks";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { CompositeScreenProps, useNavigation, useIsFocused } from "@react-navigation/native";
import { Text, Flex, IconsLegacy, Box, ScrollContainer } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/usePostOnboardingEntryPointVisibleOnWallet";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getEnv } from "@ledgerhq/live-env";
import { TrackScreen, track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { bleDevicesSelector } from "~/reducers/ble";
import Touchable from "../Touchable";
import { saveBleDeviceName, updateKnownDevice } from "~/actions/ble";
import { setHasConnectedDevice, updateMainNavigatorVisibility } from "~/actions/appstate";
import { setLastConnectedDevice, setReadOnlyMode } from "~/actions/settings";
import { BaseComposite, StackNavigatorProps } from "../RootNavigator/types/helpers";
import { MyLedgerNavigatorStackParamList } from "../RootNavigator/types/MyLedgerNavigator";
import { MainNavigatorParamList } from "../RootNavigator/types/MainNavigator";
import PostOnboardingEntryPointCard from "../PostOnboarding/PostOnboardingEntryPointCard";
import BleDevicePairingFlow, {
  PairingFlowStep,
  SetHeaderOptionsRequest,
} from "../BleDevicePairingFlow";
import BuyDeviceCTA from "../BuyDeviceCTA";
import { useDebouncedRequireBluetooth } from "../RequiresBLE/hooks/useRequireBluetooth";
import BluetoothRequirementsDrawer from "../RequiresBLE/BluetoothRequirementsDrawer";
import QueuedDrawer from "../QueuedDrawer";
import { DeviceList } from "./DeviceList";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  filterScannedDevice,
  findMatchingNewDevice,
  HIDDiscoveredDevice,
  ScannedDevice,
  useBleDevicesScanning,
  useHidDevicesDiscovery,
} from "@ledgerhq/live-dmk-mobile";
import styled from "styled-components/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DisplayedDevice } from "./DisplayedDevice";
import BleDeviceNotAvailableDrawer from "./BleDeviceNotAvailableDrawer";
import { TAB_BAR_HEIGHT } from "../TabBar/shared";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useAutoSelectDevice } from "./useAutoSelectDevice";
import { DeviceLockedCheckDrawer } from "./DeviceLockedCheckDrawer";
import { useMockBleDevicesScanning } from "~/transport/bleTransport/useMockBle";
import { useMockHidDevicesDiscovery } from "~/transport/useMockHidDiscovery";

export type { SetHeaderOptionsRequest };

type Navigation = BaseComposite<
  CompositeScreenProps<
    StackNavigatorProps<MyLedgerNavigatorStackParamList>,
    StackNavigatorProps<MainNavigatorParamList>
  >
>;

type Props = {
  onSelect: (device: Device, discoveredDevice?: DiscoveredDevice) => void;
  /**
   * This component has side-effects because it performs BLE scanning.
   * BLE Scanning and BLE connection cannot occur at the same time.
   * Components consuming this component need to stop the BLE scanning before starting
   * to communicate with a device via BLE.
   */
  stopBleScanning?: boolean;
  /**
   * SelectDevice component can sometimes need to override the current header (during the bluetooth pairing flow for ex).
   * Any screen consuming this component (directly or indirectly, this prop should be passed along by any intermediary component)
   * should react to a request from this component to set or to clean its header.
   */
  requestToSetHeaderOptions: (request: SetHeaderOptionsRequest) => void;
  hasPostOnboardingEntryPointCard?: boolean;
  /**
   * Determines what will happen when the user taps on "Add a new device" button.
   * - If false, the screen will go in a "pairing state" where all scanned BLE devices are shown.
   * - If true, a choice drawer will be displayed to the user to select a device. The choice is between:
   *    - "Set up a new Ledger" which redirects to the onboarding
   *    - "Connect an existing Ledger" switches to the "pairing state" where all scanned BLE devices are shown.
   */
  isChoiceDrawerDisplayedOnAddDevice?: boolean;
  withMyLedgerTracking?: boolean;
  /**
   * If provided, this component will only display devices of the given model ID.
   */
  filterByDeviceModelId?: DeviceModelId;
  /**
   * Additional content to render below the device list.
   */
  children?: React.ReactNode;
  /**
   * If true, this component will automatically select the last connected device if available.
   */
  autoSelectLastConnectedDevice?: boolean;
  /**
   * If true, this component will connect to the device and check if it's locked before calling onSelect.
   * onSelect will only be called if the device is not locked.
   * If the device is locked of if any other error occurs, there will be an error drawer displayed to the user until the device is unlocked, the error is resolved or the user closes the drawer.
   */
  performDeviceLockedCheck?: boolean;
};

/**
 * This component is used to select a device to connect to.
 *
 * Refer to the README.md file for more details.
 */
export default function SelectDevice({
  onSelect,
  requestToSetHeaderOptions,
  isChoiceDrawerDisplayedOnAddDevice = true,
  hasPostOnboardingEntryPointCard,
  withMyLedgerTracking,
  filterByDeviceModelId,
  children,
  stopBleScanning,
  autoSelectLastConnectedDevice,
  performDeviceLockedCheck = true,
}: Props) {
  const { t } = useTranslation();
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const [USBDevice, setUSBDevice] = useState<
    (Device & { discoveredDevice: DiscoveredDevice }) | undefined
  >();
  const [ProxyDevice, setProxyDevice] = useState<Device | undefined>();

  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { bottom } = useSafeAreaInsets();

  const [isAddNewDrawerOpen, setIsAddNewDrawerOpen] = useState<boolean>(false);
  const [isPairingDevices, setIsPairingDevices] = useState<boolean>(false);

  const postOnboardingVisible = usePostOnboardingEntryPointVisibleOnWallet();
  const isPostOnboardingVisible = hasPostOnboardingEntryPointCard && postOnboardingVisible;

  const bleKnownDevices = useSelector(bleDevicesSelector);
  const navigation = useNavigation<Navigation["navigation"]>();

  const [deviceToCheckLockedStatus, setDeviceToCheckLockedStatus] = useState<Device | null>(null);
  const [discoveredDeviceToCheckLockedStatus, setDiscoveredDeviceToCheckLockedStatus] = useState<
    DiscoveredDevice | undefined
  >(undefined);

  const [pairingFlowStep, setPairingFlowStep] = useState<PairingFlowStep | null>(null);

  /**
   * FIXME: Swapping between mock and real hooks is not ideal.
   * This is a temporary workaround to keep e2e tests working until transport-level mocking is implemented
   * directly with the DMK, which will allow real hooks to work transparently with mocked transports.
   * Previously it was working because the discovery mocks were done directly inside the legacy HID and BLE transports.
   * We have to progressively remove those legacy transports, hence this temporary workaround.
   */
  const isMockMode = Boolean(Config.MOCK || Config.DETOX);

  const mockHidState = useMockHidDevicesDiscovery(isMockMode);
  const realHidState = useHidDevicesDiscovery(!isMockMode);
  const { hidDevices } = isMockMode ? mockHidState : realHidState;

  const scanningEnabled =
    isFocused && !stopBleScanning && pairingFlowStep !== "pairing" && !deviceToCheckLockedStatus;

  const mockScanningState = useMockBleDevicesScanning(isMockMode && scanningEnabled);
  const realScanningState = useBleDevicesScanning(!isMockMode && scanningEnabled);

  const bleScanningState = isMockMode ? mockScanningState : realScanningState;

  const scannedDevices = bleScanningState.scannedDevices;

  const filteredScannedDevices = useMemo(() => {
    return scannedDevices.filter(device =>
      filterScannedDevice(device, {
        filterByDeviceModelIds: filterByDeviceModelId ? [filterByDeviceModelId] : undefined,
      }),
    );
  }, [scannedDevices, filterByDeviceModelId]);

  // To be able to triggers the device selection once all the bluetooth requirements are respected
  const [selectedBleDevice, setSelectedBleDevice] = useState<Device | null>(null);
  const isBleRequired = Boolean(selectedBleDevice);

  const [showSelectedBleDeviceNotAvailableDrawer, setShowSelectedBleDeviceNotAvailableDrawer] =
    useState(false);

  // Enforces the BLE requirements for a "connecting" action. The requirements are only enforced
  // if the bluetooth is needed (isBleRequired is true).
  const { bluetoothRequirementsState, retryRequestOnIssue, cannotRetryRequest } =
    useDebouncedRequireBluetooth({
      requiredFor: "connecting",
      isHookEnabled: isBleRequired,
    });

  // If the user tries to close the drawer displaying issues on BLE requirements,
  // this cancels the requirements checking and does not do anything in order to stop the
  // connection with a device via BLE
  const onUserCloseRequireBluetoothDrawer = useCallback(() => {
    setSelectedBleDevice(null);
  }, []);

  const notifyDeviceSelected = useCallback(
    (device: Device, discoveredDevice?: DiscoveredDevice) => {
      dispatch(updateMainNavigatorVisibility(true));
      dispatch(setLastConnectedDevice(device));
      dispatch(setHasConnectedDevice(true));
      console.log("[SelectDevice2] onSelect(discoveredDevice):", discoveredDevice);
      onSelect(device, discoveredDevice);
      dispatch(setReadOnlyMode(false));
      if (!device.wired) {
        dispatch(
          updateKnownDevice({
            id: device.deviceId,
            name: device.deviceName ?? "",
            modelId: device.modelId,
          }),
        );
      }
    },
    [dispatch, onSelect],
  );

  const checkDeviceStatus = useCallback(
    (device: Device, discoveredDevice?: DiscoveredDevice) => {
      const isMockEnv = getEnv("MOCK");
      if (performDeviceLockedCheck && !isMockEnv) {
        setDeviceToCheckLockedStatus(device);
        setDiscoveredDeviceToCheckLockedStatus(discoveredDevice);
      } else {
        notifyDeviceSelected(device, discoveredDevice);
      }
    },
    [performDeviceLockedCheck, notifyDeviceSelected],
  );

  const handleDeviceUnlocked = useCallback(() => {
    setDeviceToCheckLockedStatus(null);
    setDiscoveredDeviceToCheckLockedStatus(undefined);
    deviceToCheckLockedStatus &&
      notifyDeviceSelected(deviceToCheckLockedStatus, discoveredDeviceToCheckLockedStatus);
  }, [notifyDeviceSelected, deviceToCheckLockedStatus, discoveredDeviceToCheckLockedStatus]);

  const handleDeviceLockedCheckClosed = useCallback(() => {
    setDeviceToCheckLockedStatus(null);
    setDiscoveredDeviceToCheckLockedStatus(undefined);
  }, []);

  const handleOnSelect = useCallback(
    (device: DisplayedDevice) => {
      dispatch(updateMainNavigatorVisibility(true));

      const { modelId, wired, deviceId, discoveredDevice } = device;
      track("Device selection", {
        modelId,
        connectionType: wired ? "USB" : "BLE",
      });

      // Skip bluetooth requirements in mock/test environments or for proxy-debug devices
      const isMockEnv = getEnv("MOCK");
      const isProxyDebug = deviceId.includes("httpdebug");

      // If neither wired nor in mock/debug mode, it's a BLE device
      if (!wired && !isMockEnv && !isProxyDebug) {
        setSelectedBleDevice(device);
      } else {
        setSelectedBleDevice(null);
        checkDeviceStatus(device, discoveredDevice);
      }

      setIsPairingDevices(false);
    },
    [dispatch, setSelectedBleDevice, checkDeviceStatus],
  );

  /**
   * When the user selects a device, the data we keep in state is static, it does not reflect the dynamic availability of the device.
   * The availability of the device might change after the user selects it.
   * This hook is used to get the dynamic information about the device.
   */
  const availableDeviceMatchingSelectedBleDevice = useMemo<ScannedDevice | null>(() => {
    if (!selectedBleDevice) return null;
    return (findMatchingNewDevice(selectedBleDevice, scannedDevices) as ScannedDevice) ?? null;
  }, [selectedBleDevice, scannedDevices]);

  useEffect(() => {
    if (!selectedBleDevice) return;
    // Handle case where the "device not available" drawer is open and the device becomes available again.
    if (showSelectedBleDeviceNotAvailableDrawer && availableDeviceMatchingSelectedBleDevice) {
      setSelectedBleDevice(null);
      setShowSelectedBleDeviceNotAvailableDrawer(false);
      checkDeviceStatus(
        { ...availableDeviceMatchingSelectedBleDevice, wired: false },
        availableDeviceMatchingSelectedBleDevice.discoveredDevice,
      );
      return;
    }
    // Once all the bluetooth requirements are respected, the device selection is triggered
    if (bluetoothRequirementsState === "all_respected" && selectedBleDevice) {
      // If the device is not available, display the "device not available" drawer
      if (!availableDeviceMatchingSelectedBleDevice) {
        setShowSelectedBleDeviceNotAvailableDrawer(true);
        return;
      }
      checkDeviceStatus(
        { ...availableDeviceMatchingSelectedBleDevice, wired: false },
        availableDeviceMatchingSelectedBleDevice.discoveredDevice,
      );
      setSelectedBleDevice(null);
      setShowSelectedBleDeviceNotAvailableDrawer(false);
    }
  }, [
    bluetoothRequirementsState,
    selectedBleDevice,
    checkDeviceStatus,
    availableDeviceMatchingSelectedBleDevice,
    showSelectedBleDeviceNotAvailableDrawer,
  ]);

  useEffect(() => {
    if (hidDevices.length > 0) {
      const device = hidDevices[0];
      setUSBDevice({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        modelId: device.modelId,
        wired: device.wired,
        discoveredDevice: device.discoveredDevice,
      });
    } else {
      setUSBDevice(undefined);
    }
  }, [hidDevices]);

  /**
   * Discover proxy devices (NB: currently needed for Speculos testing)
   */
  useEffect(() => {
    const filter = ({ id }: { id: string }) => ["httpdebug"].includes(id);
    const sub = discoverDevices(filter).subscribe(e => {
      if (e.type === "remove") setProxyDevice(undefined);
      if (e.type === "add") {
        const { name, deviceModel, id, wired } = e;

        if (!deviceModel) return;

        const newDevice = {
          deviceName: name,
          modelId: deviceModel.id,
          deviceId: id,
          wired,
        };

        setProxyDevice((maybeDevice: Device | undefined) => {
          return maybeDevice || newDevice;
        });
      }
    });
    return () => sub.unsubscribe();
  }, []);

  /**
   * Callback for auto-selection that converts Device to DisplayedDevice.
   * Tries to find discoveredDevice from scannedDevices (BLE) or hidDevices (USB).
   */
  const handleAutoSelect = useCallback(
    (device: Device) => {
      let discoveredDevice: DiscoveredDevice | undefined;
      if (device.wired) {
        const matchingHidDevice = findMatchingNewDevice(
          device,
          hidDevices,
        ) as HIDDiscoveredDevice | null;
        discoveredDevice = matchingHidDevice?.discoveredDevice;
      } else {
        const matchingScannedDevice = findMatchingNewDevice(
          device,
          scannedDevices,
        ) as ScannedDevice | null;
        discoveredDevice = matchingScannedDevice?.discoveredDevice;
      }
      handleOnSelect({
        ...device,
        available: true,
        discoveredDevice,
      });
    },
    [handleOnSelect, scannedDevices, hidDevices],
  );

  /**
   * Auto selection of the last connected device
   */
  useAutoSelectDevice({
    enabled: isFocused,
    deviceToAutoSelect: autoSelectLastConnectedDevice ? lastConnectedDevice : null,
    availableUSBDevice: USBDevice,
    onAutoSelect: handleAutoSelect,
    usbDeviceToSelectExpirationDuration: 1200,
  });

  const deviceList = useMemo(() => {
    let devices: DisplayedDevice[] = bleKnownDevices
      .map(device => {
        const matchingScannedDevice = findMatchingNewDevice(
          {
            deviceId: device.id,
            deviceName: device.name,
            modelId: device.modelId,
          },
          filteredScannedDevices,
        ) as ScannedDevice | null;
        return {
          ...device,
          wired: false,
          deviceId: matchingScannedDevice?.deviceId ?? device.id,
          deviceName: matchingScannedDevice?.deviceName ?? device.name,
          available: Boolean(matchingScannedDevice),
          discoveredDevice: matchingScannedDevice?.discoveredDevice,
        };
      })
      .sort((a, b) => Number(b.available) - Number(a.available));

    if (USBDevice) {
      devices = [{ ...USBDevice, available: true }, ...devices];
    }
    if (ProxyDevice) {
      devices = [{ ...ProxyDevice, available: true }, ...devices];
    }

    return filterByDeviceModelId
      ? devices.filter(d => d.modelId === filterByDeviceModelId)
      : devices;
  }, [bleKnownDevices, filteredScannedDevices, USBDevice, ProxyDevice, filterByDeviceModelId]);

  // update device name on store when needed
  useEffect(() => {
    for (const knownDevice of bleKnownDevices) {
      const equivalentScannedDevice = findMatchingNewDevice(
        {
          deviceId: knownDevice.id,
          deviceName: knownDevice.name,
          modelId: knownDevice.modelId,
        },
        filteredScannedDevices,
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
    }
  }, [dispatch, bleKnownDevices, filteredScannedDevices]);

  const onAddNewPress = useCallback(() => setIsAddNewDrawerOpen(true), []);

  const openBlePairingFlow = useCallback(() => {
    // When starting the ble pairing flow, the tab bottom bar is not displayed
    dispatch(updateMainNavigatorVisibility(false));
    setIsAddNewDrawerOpen(false);
    setIsPairingDevices(true);
  }, [dispatch]);

  // Makes sure that on go back/unmount the visibility of the bottom tab bar is reset
  useEffect(() => {
    return () => {
      dispatch(updateMainNavigatorVisibility(true));
    };
  }, [dispatch]);

  // Makes sure that when loosing (screen) focus, the visibility of the bottom tab bar is reset
  useEffect(() => {
    return () => {
      // Just before cleaning, the associated screen had focus
      if (isFocused) {
        dispatch(updateMainNavigatorVisibility(true));
      }
    };
  }, [dispatch, isFocused]);

  const closeBlePairingFlow = useCallback(() => {
    // When coming back from the pairing, the visibility of the bottom tab bar is reset
    dispatch(updateMainNavigatorVisibility(true));
    setIsPairingDevices(false);
    setIsAddNewDrawerOpen(false);
  }, [dispatch]);

  /**
   * Callback for BleDevicePairingFlow.onPairingSuccess that receives both device and discoveredDevice.
   */
  const handleOnSelectFromPairingFlow = useCallback(
    (device: Device, discoveredDevice: DiscoveredDevice) => {
      handleOnSelect({
        ...device,
        available: true,
        discoveredDevice,
      });
    },
    [handleOnSelect],
  );

  const onSetUpNewDevice = useCallback(() => {
    setIsAddNewDrawerOpen(false);

    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
  }, [navigation]);

  const addNewButtonEventProps = useMemo(
    () =>
      withMyLedgerTracking
        ? {
            event: "button_clicked",
            eventProperties: {
              button: "Add new device",
            },
          }
        : {},
    [withMyLedgerTracking],
  );

  const trackScreenProps = useMemo(
    () => ({
      category: "My Ledger",
      "number of devices connected": deviceList.length,
      "model of devices connected": deviceList.map(d => d.modelId).sort(),
    }),
    [deviceList],
  );

  const handleBleDeviceNotAvailableDrawerClose = useCallback(() => {
    setShowSelectedBleDeviceNotAvailableDrawer(false);
    setSelectedBleDevice(null);
  }, [setShowSelectedBleDeviceNotAvailableDrawer, setSelectedBleDevice]);

  return (
    <StyledView>
      {withMyLedgerTracking ? <TrackScreen {...trackScreenProps} /> : null}
      <DeviceLockedCheckDrawer
        isOpen={Boolean(deviceToCheckLockedStatus)}
        device={deviceToCheckLockedStatus}
        onDeviceUnlocked={handleDeviceUnlocked}
        onClose={handleDeviceLockedCheckClosed}
      />
      <BluetoothRequirementsDrawer
        isOpenedOnIssue={isBleRequired}
        onUserClose={onUserCloseRequireBluetoothDrawer}
        bluetoothRequirementsState={bluetoothRequirementsState}
        retryRequestOnIssue={retryRequestOnIssue}
        cannotRetryRequest={cannotRetryRequest}
      />
      {!!selectedBleDevice && (
        <BleDeviceNotAvailableDrawer
          isOpen={showSelectedBleDeviceNotAvailableDrawer}
          device={selectedBleDevice}
          onClose={handleBleDeviceNotAvailableDrawerClose}
          redirectToScan={openBlePairingFlow}
        />
      )}
      {/* @Fixme Add a hidden text element to render screen correctly on ios sim release e2e test */}
      <Text style={{ height: 0, opacity: 0 }}>
        {"Hidden text element to pass detox ios release onboarding.spec"}
      </Text>
      {isPairingDevices ? (
        <BleDevicePairingFlow
          onPairingSuccess={handleOnSelectFromPairingFlow}
          onGoBackFromScanning={closeBlePairingFlow}
          onPairingSuccessAddToKnownDevices
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          filterByDeviceModelId={filterByDeviceModelId}
          onPairingFlowStepChanged={setPairingFlowStep}
          bleScanningState={bleScanningState}
        />
      ) : (
        <Flex flex={1}>
          <ScrollContainer
            mb={4}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "space-between",
              flexDirection: "column",
            }}
          >
            <Flex>
              <Flex>
                {isPostOnboardingVisible && (
                  <Box mx={4} mb={8}>
                    <PostOnboardingEntryPointCard />
                  </Box>
                )}
                <Flex
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                  px={16}
                >
                  <Text variant="h5" fontWeight="semiBold">
                    {t("manager.selectDevice.title")}
                  </Text>
                  {deviceList.length > 0 && (
                    <Touchable
                      onPress={
                        isChoiceDrawerDisplayedOnAddDevice ? onAddNewPress : openBlePairingFlow
                      }
                      {...addNewButtonEventProps}
                    >
                      <Flex flexDirection="row" alignItems="center">
                        <Text color="primary.c90" mr={3} fontWeight="semiBold">
                          {t(
                            `manager.selectDevice.${
                              Platform.OS === "android" ? "addWithBluetooth" : "addNewCTA"
                            }`,
                          )}
                        </Text>
                        <IconsLegacy.PlusMedium color="primary.c90" size={15} />
                      </Flex>
                    </Touchable>
                  )}
                </Flex>
              </Flex>

              <Flex pt={16}>
                <Flex px={16}>
                  {deviceList.length > 0 ? (
                    <DeviceList deviceList={deviceList} handleOnSelect={handleOnSelect} />
                  ) : (
                    <Touchable
                      touchableTestID="connect-with-bluetooth"
                      onPress={
                        isChoiceDrawerDisplayedOnAddDevice ? onAddNewPress : openBlePairingFlow
                      }
                      {...addNewButtonEventProps}
                    >
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
                        <IconsLegacy.PlusMedium color="neutral.c90" size={20} />
                        <Text variant="large" fontWeight="semiBold" ml={5}>
                          {t(
                            `manager.selectDevice.${
                              Platform.OS === "android" ? "addWithBluetooth" : "addALedger"
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
                        mt={3}
                        mb={3}
                      >
                        {t("manager.selectDevice.otgBanner")}
                      </Text>
                    )}
                </Flex>
                {children}
              </Flex>
            </Flex>
            <Flex alignItems="center" my={8} mb={bottom + TAB_BAR_HEIGHT + 8}>
              <BuyDeviceCTA />
            </Flex>
          </ScrollContainer>
          <QueuedDrawer
            isRequestingToBeOpened={isAddNewDrawerOpen}
            onClose={() => setIsAddNewDrawerOpen(false)}
          >
            <Flex>
              {withMyLedgerTracking ? (
                <TrackScreen category={"Add a Ledger device"} type="drawer" refreshSource={false} />
              ) : null}
              <Touchable
                onPress={onSetUpNewDevice}
                testID="manager_setup_new_device"
                {...(withMyLedgerTracking
                  ? {
                      event: "button_clicked",
                      eventProperties: {
                        button: "Set up a new Ledger",
                        drawer: "Add a Ledger device",
                      },
                    }
                  : {})}
              >
                <Flex backgroundColor="neutral.c30" mb={4} px={6} py={7} borderRadius={8}>
                  <Flex flexDirection="row" justifyContent="space-between">
                    <Flex flexShrink={1}>
                      <Text variant="large" fontWeight="semiBold" mb={3}>
                        {t("manager.selectDevice.setUpNewLedger")}
                      </Text>
                      <Text variant="paragraph" color="neutral.c80">
                        {t("manager.selectDevice.setUpNewLedgerDescription")}
                      </Text>
                    </Flex>
                    <Flex justifyContent="center" alignItems="center" ml={5} mr={2}>
                      <Flex borderRadius="9999px" backgroundColor="neutral.c40" p={4}>
                        <IconsLegacy.PlusMedium color="primary.c80" size={24} />
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              </Touchable>
              <Touchable
                onPress={openBlePairingFlow}
                testID="manager_connect_device"
                {...(withMyLedgerTracking
                  ? {
                      event: "button_clicked",
                      eventProperties: {
                        button: "Connect with Bluetooth",
                        drawer: "Add a Ledger device",
                      },
                    }
                  : {})}
              >
                <Flex backgroundColor="neutral.c30" px={6} py={7} borderRadius={8}>
                  <Flex flexDirection="row" justifyContent="space-between">
                    <Flex flexShrink={1}>
                      <Text variant="large" fontWeight="semiBold" mb={3}>
                        {t("manager.selectDevice.connectExistingLedger")}
                      </Text>
                      <Text variant="paragraph" color="neutral.c80">
                        {t("manager.selectDevice.connectExistingLedgerDescription")}
                      </Text>
                    </Flex>
                    <Flex justifyContent="center" alignItems="center" ml={5} mr={2}>
                      <Flex borderRadius="9999px" backgroundColor="neutral.c40" p={4}>
                        <IconsLegacy.BluetoothMedium color="primary.c80" size={24} />
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              </Touchable>
            </Flex>
          </QueuedDrawer>
        </Flex>
      )}
    </StyledView>
  );
}

const StyledView = styled(View)`
  flex: 1;
`;
