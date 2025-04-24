import React, {
  useRef,
  useEffect,
  memo,
  useCallback,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";

import { State, AppsDistribution, Action } from "@ledgerhq/live-common/apps/index";
import { App, DeviceInfo, idsToLanguage } from "@ledgerhq/types-live";

import { Flex, Text, Button, Divider, IconsLegacy } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/device/use-cases/isDeviceLocalizationSupported";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { lastSeenCustomImageSelector } from "~/reducers/settings";
import DeviceAppStorage from "./DeviceAppStorage";

import NanoS from "~/images/devices/NanoS";
import Stax from "~/images/devices/Stax";
import Europa from "~/images/devices/Europa";
import NanoX from "~/images/devices/NanoX";

import DeviceName from "./DeviceName";
import InstalledAppsModal from "../Modals/InstalledAppsModal";

import DeviceLanguage from "./DeviceLanguage";
import CustomLockScreen from "./CustomLockScreen";
import { isCustomLockScreenSupported } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { TransportBleDevice } from "@ledgerhq/live-common/ble/types";
import getBLETransport from "~/react-native-hw-transport-ble";
import { v4 as uuid } from "uuid";
import { useLdmkFeatureEnabled } from "@ledgerhq/live-dmk-mobile";
import { LocalTracer } from "@ledgerhq/logs";
import { delay } from "@ledgerhq/live-common/promise";
import { getDeviceName } from "@ledgerhq/live-common/device/use-cases/getDeviceNameUseCase";
import { Observable } from "rxjs";
import { DescriptorEvent } from "@ledgerhq/hw-transport";
import logger from "~/logger";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "~/utils/constants";
import { discoverDevices, open } from "@ledgerhq/live-common/hw/index";
import { APDU } from "@ledgerhq/hw-ledger-key-ring-protocol/ApduDevice";

const illustrations = {
  nanoS: NanoS,
  nanoSP: NanoS,
  nanoX: NanoX,
  blue: NanoS,
  stax: Stax,
  europa: Europa,
};

type Props = PropsWithChildren<{
  distribution: AppsDistribution;
  state: State;
  result: ListAppsResult;
  deviceId: string;
  initialDeviceName?: string | null;
  pendingInstalls: boolean;
  deviceInfo: DeviceInfo;
  device: Device;
  dispatch: (action: Action) => void;
  appList: App[];
  onLanguageChange: () => void;
}>;

const BorderCard = styled.View`
  flex-direction: column;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 8px;
`;

const DeviceCard = ({
  distribution,
  state,
  device,
  initialDeviceName,
  pendingInstalls,
  deviceInfo,
  dispatch,
  appList,
  onLanguageChange,
  children,
}: Props) => {
  const { colors, theme } = useTheme();
  const lastSeenCustomImage = useSelector(lastSeenCustomImageSelector);
  const isFirstCustomImageUpdate = useRef<boolean>(true);
  const isLDMKEnabled = useLdmkFeatureEnabled();
  const [tracer] = useState(() => new LocalTracer("ble-ui", { component: "PairDevicesInner" }));
  const [devices, setDevices] = useState<TransportBleDevice[]>([]);
  const [USBDevice, setUSBDevice] = useState<Device | undefined>();
  const [ProxyDevice, setProxyDevice] = useState<Device | undefined>();

  const { deviceModel } = state;
  const [appsModalOpen, setAppsModalOpen] = useState(false);

  const [illustration] = useState(
    illustrations[deviceModel.id]({ color: colors.neutral.c100, theme }),
  );
  const onTimeout = () => {
    console.log("Timeout ended");
  };
  useEffect(() => {
    const timeout = setTimeout(() => {
      onTimeout();
    }, BLE_SCANNING_NOTHING_TIMEOUT);

    const sub = Observable.create(getBLETransport({ isLDMKEnabled }).listen).subscribe({
      next: (e: DescriptorEvent<TransportBleDevice>) => {
        if (e.type === "add") {
          const device = e.descriptor;
          // FIXME seems like we have dup. ideally we'll remove them on the listen side!
          setDevices(devices =>
            devices.some(i => i.id === device.id) ? devices : [...devices, device],
          );
        }
      },
      error: (error: Error) => {
        logger.critical(error);
      },
    });

    return () => {
      sub.unsubscribe();
      clearTimeout(timeout);
    };
  }, [isLDMKEnabled]);

  useEffect(() => {
    if (devices) console.log("Devices found:", devices);
    if (USBDevice) console.log("USB Device found:", USBDevice);
    if (ProxyDevice) console.log("Proxy Device found:", ProxyDevice);
  }, [devices, ProxyDevice, USBDevice]);

  useEffect(() => {
    const filter = ({ id }: { id: string }) => true;
    const setDeviceFromId = (id: string) => (id.startsWith("usb") ? setUSBDevice : setProxyDevice);
    const sub = discoverDevices(filter).subscribe(e => {
      console.log("Device event:", e);
      const setDevice = setDeviceFromId(e.id);
      if (e.type === "remove") setDevice(undefined);
      if (e.type === "add") {
        const { name, deviceModel, id, wired } = e;

        if (!deviceModel) return;

        setDevice((maybeDevice: Device | undefined) => {
          return (
            maybeDevice || {
              deviceName: name,
              modelId: deviceModel.id,
              deviceId: id,
              wired,
            }
          );
        });
      }
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (isFirstCustomImageUpdate.current) {
      isFirstCustomImageUpdate.current = false;
    } else {
      dispatch({ type: "setCustomImage", lastSeenCustomImage });
    }
  }, [dispatch, lastSeenCustomImage]);

  const openAppsModal = useCallback(() => {
    setAppsModalOpen(true);
  }, [setAppsModalOpen]);

  const closeAppsModal = useCallback(() => {
    setAppsModalOpen(false);
  }, [setAppsModalOpen]);

  useEffect(() => {
    if (state?.currentError?.error) {
      closeAppsModal();
    }
  }, [state.currentError, closeAppsModal]);

  const isLocalizationSupported = useMemo<boolean>(
    () =>
      deviceInfo.seVersion
        ? isDeviceLocalizationSupported(deviceInfo.seVersion, deviceModel.id)
        : false,
    [deviceInfo.seVersion, deviceModel.id],
  );

  const showDeviceLanguage = isLocalizationSupported && deviceInfo.languageId !== undefined;

  const disableFlows = pendingInstalls;

  const pingDevice = useCallback(async () => {
    const bleDeviceId = device.deviceId;

    try {
      console.log("Ping device....");
      const transport = await open(bleDeviceId);
      const ringCommand = "RING CLA: E0 INS: 02 P1: 00 P2: 00 DATA: N/A SW: 90 00";
      console.log("Transport:", transport);
      await transport.send(0xe0, 0x02, 0x00, 0x00, Buffer.from([]));
      try {
        tracer.trace("Device info", { deviceInfo });

        // listApps has completed, a new APDU can be sent
        const name = (await getDeviceName(transport)) || device.deviceName || "";
        tracer.trace("Fetched device name", { name });
        console.log("Device name!!!!:", name);
      } finally {
        await transport.close();
        // @FixMe We use here the transport BLE from ../../react-native-hw-transport-ble to fix Detox E2E
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await getBLETransport({ isLDMKEnabled })
          .disconnectDevice(device.deviceId)
          .catch(() => {});
        await delay(500);
      }
    } catch (error) {
      console.log("Error pinging device:", error);
      console.warn(error);
    }
  }, [device, deviceInfo, isLDMKEnabled, tracer]);
  return (
    <BorderCard>
      {children}
      <Flex flexDirection={"row"} mt={20} mx={4} mb={8} alignItems="center">
        {illustration}
        <Flex
          flex={1}
          flexDirection={"column"}
          alignItems={"flex-start"}
          justifyContent="center"
          ml={4}
        >
          <DeviceName
            device={device}
            deviceInfo={deviceInfo}
            initialDeviceName={initialDeviceName}
            disabled={disableFlows}
          />
          <Flex backgroundColor={"neutral.c30"} py={1} px={3} borderRadius={4} my={2}>
            <Text
              variant={"subtitle"}
              fontWeight={"semiBold"}
              color={"neutral.c80"}
              testID="manager-device-version"
            >
              <Trans
                i18nKey="FirmwareVersionRow.subtitle"
                values={{ version: deviceInfo.version }}
              />
            </Text>
          </Flex>
          <Flex flexDirection={"row"} alignItems={"center"} mt={2} mb={3}>
            <IconsLegacy.CircledCheckSolidMedium size={18} color={"palette.success.c50"} />
            <Text
              variant={"body"}
              fontWeight={"medium"}
              color={"palette.neutral.c80"}
              numberOfLines={1}
              ml={2}
            >
              <Trans i18nKey="DeviceItemSummary.genuine" />
            </Text>
          </Flex>
        </Flex>
      </Flex>
      {isCustomLockScreenSupported(deviceModel.id) || showDeviceLanguage ? (
        <>
          <Flex px={6}>
            {isCustomLockScreenSupported(deviceModel.id) && (
              <CustomLockScreen
                disabled={disableFlows}
                device={device}
                deviceModelId={deviceModel.id}
              />
            )}
            {showDeviceLanguage && (
              <Flex mt={isCustomLockScreenSupported(deviceModel.id) ? 6 : 0}>
                <DeviceLanguage
                  disabled={disableFlows}
                  currentDeviceLanguage={
                    idsToLanguage[deviceInfo.languageId as keyof typeof idsToLanguage]
                  }
                  deviceInfo={deviceInfo}
                  device={device}
                  onLanguageChange={onLanguageChange}
                />
              </Flex>
            )}
          </Flex>
          <Flex p={6}>
            <Divider />
          </Flex>
        </>
      ) : null}
      <DeviceAppStorage
        distribution={distribution}
        deviceModel={deviceModel}
        installQueue={state.installQueue}
        uninstallQueue={state.uninstallQueue}
        deviceInfo={deviceInfo}
      />
      {appList.length > 0 && (
        <Flex mx={6} mb={6}>
          <Button size="small" type="color" onPress={openAppsModal}>
            <Trans i18nKey="manager.myApps" />
          </Button>
        </Flex>
      )}
      <Flex mx={6} mb={6}>
        <Button size="small" type="color" onPress={pingDevice}>
          <Text style={{ color: "#FFFFFF" }}>Find my device</Text>
        </Button>
      </Flex>
      <InstalledAppsModal
        isOpen={appsModalOpen}
        onClose={closeAppsModal}
        state={state}
        dispatch={dispatch}
        appList={appList}
        illustration={illustration}
        deviceInfo={deviceInfo}
      />
    </BorderCard>
  );
};

export default memo(DeviceCard);
