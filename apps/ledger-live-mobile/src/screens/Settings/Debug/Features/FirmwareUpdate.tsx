import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Subject } from "rxjs";
import { Button, Flex, Slider, Switch, Text } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native-gesture-handler";
import {
  initialState,
  UpdateFirmwareActionState,
} from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { UpdateFirmwareTaskError } from "@ledgerhq/live-common/deviceSDK/tasks/updateFirmware";
import { GetLatestFirmwareTaskError } from "@ledgerhq/live-common/deviceSDK/tasks/getLatestFirmware";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { FirmwareUpdateContext } from "@ledgerhq/types-live";

import { FirmwareUpdate } from "../../../FirmwareUpdate";

const mockFirmwareUpdateContext: FirmwareUpdateContext = {
  final: {
    application_versions: [],
    bytes: 227672,
    date_creation: "2022-06-27T08:53:35.663668Z",
    date_last_modified: "2022-06-27T08:53:35.663668Z",
    description: null,
    device_versions: [17],
    display_name: null,
    firmware: "",
    firmware_key: "",
    hash: "",
    id: 220,
    mcu_versions: [91],
    name: "2.0.2-il3",
    notes: null,
    osu_versions: [],
    perso: "perso_11",
    providers: [13],
    se_firmware: 10,
    version: "2.0.2",
  },
  osu: {
    date_creation: "2022-06-27T08:53:37.277793Z",
    date_last_modified: "2022-09-09T13:11:26.861355Z",
    description: null,
    device_versions: [17],
    display_name: null,
    firmware: "nanox/2.0.2-il3/fw_2.0.2-il0/upgrade_osu_2.0.2_il3",
    firmware_key: "nanox/2.0.2-il3/fw_2.0.2-il0/upgrade_osu_2.0.2_il3_key",
    hash: "",
    id: 277,
    name: "2.0.2-il3-osu",
    next_se_firmware_final_version: 220,
    notes: null,
    perso: "perso_11",
    previous_se_firmware_final_version: [200],
    providers: [13],
  },
  shouldFlashMCU: true,
};

const mockDeviceInfo = {
  bootloaderVersion: undefined,
  hardwareVersion: undefined,
  hasDevFirmware: true,
  isBootloader: false,
  isOSU: false,
  isRecoveryMode: false,
  languageId: undefined,
  majMin: "2.0",
  managerAllowed: true,
  mcuBlVersion: undefined,
  mcuTargetId: undefined,
  mcuVersion: "2.90",
  onboarded: true,
  pinValidated: true,
  providerName: null,
  seTargetId: 857735172,
  seVersion: "2.0.2-il0",
  targetId: 857735172,
  version: "2.0.2-il0",
};

const mockDevice: Device = {
  deviceId: "it doesn't matter",
  modelId: DeviceModelId.stax,
  wired: false,
};

export default function DebugFirmwareUpdate() {
  const [actionState, setActionState] = useState<UpdateFirmwareActionState>(initialState);
  const updateFirmwareSubject = useMemo(() => new Subject<UpdateFirmwareActionState>(), []);
  const [isDebugBoardOpen, setIsDebugBoardOpen] = useState(false);

  useEffect(() => updateFirmwareSubject.next(actionState), [actionState, updateFirmwareSubject]);

  const updateFirmwareAction = useCallback(() => updateFirmwareSubject, [updateFirmwareSubject]);

  const updateStep = useCallback(
    (newStep: UpdateFirmwareActionState["step"]) =>
      setActionState((oldState: UpdateFirmwareActionState) => ({
        ...oldState,
        step: newStep,
      })),
    [],
  );

  const updateLockedDevice = useCallback(
    (newLockedDevice: boolean) =>
      setActionState((oldState: UpdateFirmwareActionState) => ({
        ...oldState,
        lockedDevice: newLockedDevice,
      })),
    [],
  );

  const updateProgress = useCallback(
    (newProgress: number) =>
      setActionState((oldState: UpdateFirmwareActionState) => ({
        ...oldState,
        progress: newProgress / 100,
      })),
    [],
  );

  const updateError = useCallback(
    (
      errorType: "SharedError" | "UpdateFirmwareError",
      error: UpdateFirmwareTaskError | GetLatestFirmwareTaskError,
    ) =>
      setActionState((oldState: UpdateFirmwareActionState) => ({
        ...oldState,
        error: { type: errorType, name: error, message: error, retrying: false },
      })),
    [],
  );

  const ChangeStepButton = ({ step }: { step: UpdateFirmwareActionState["step"] }) => (
    <Button size="small" type="main" m={1} onPress={() => updateStep(step)} width={130}>
      <Text color="neutral0" variant="tiny">
        {step}
      </Text>
    </Button>
  );

  const ChangeErrorButton = ({
    errorType,
    error,
  }: {
    errorType: "SharedError" | "UpdateFirmwareError";
    error: UpdateFirmwareTaskError | GetLatestFirmwareTaskError;
  }) => (
    <Button
      size="small"
      type="main"
      m={1}
      onPress={() => updateError(errorType, error)}
      width={130}
    >
      <Text color="neutral0" variant="tiny">
        {error}
      </Text>
    </Button>
  );

  return (
    <Flex flex={1}>
      <FirmwareUpdate
        updateFirmwareAction={updateFirmwareAction}
        device={mockDevice}
        deviceInfo={mockDeviceInfo}
        firmwareUpdateContext={mockFirmwareUpdateContext}
      />
      {isDebugBoardOpen ? (
        <Flex
          position="absolute"
          bottom={10}
          mx={8}
          p={5}
          height={350}
          backgroundColor="rgba(255,255,255,0.1)"
          borderRadius={5}
        >
          <Button
            type="main"
            size="small"
            width={50}
            ml="auto"
            onPress={() => setIsDebugBoardOpen(false)}
          >
            -
          </Button>
          <ScrollView>
            <Text variant="h5" mb={2}>
              Step:
            </Text>
            <Flex flexDirection="row" flexWrap={"wrap"} rowGap={2}>
              <ChangeStepButton step="installingOsu" />
              <ChangeStepButton step="flashingBootloader" />
              <ChangeStepButton step="flashingMcu" />
              <ChangeStepButton step="installOsuDevicePermissionRequested" />
              <ChangeStepButton step="installOsuDevicePermissionGranted" />
              <ChangeStepButton step="installOsuDevicePermissionDenied" />
              <ChangeStepButton step="allowSecureChannelRequested" />
              <ChangeStepButton step="firmwareUpdateCompleted" />
              <ChangeStepButton step="preparingUpdate" />
            </Flex>
            <Text variant="h5" mb={2} mt={4}>
              Locked Device:
            </Text>
            <Switch checked={actionState.lockedDevice} onChange={updateLockedDevice} />
            <Text variant="h5" mb={2} mt={4}>
              Progress:
            </Text>
            <Slider
              max={100}
              min={0}
              step={1}
              value={actionState.progress * 100}
              onChange={updateProgress}
            />
            <Text variant="h5" mb={2} mt={4}>
              Error:
            </Text>
            <Flex flexDirection="row" flexWrap={"wrap"} rowGap={2}>
              <ChangeErrorButton
                errorType="UpdateFirmwareError"
                error="DeviceOnBootloaderExpected"
              />
              <ChangeErrorButton
                errorType="UpdateFirmwareError"
                error="DeviceOnDashboardExpected"
              />
              <ChangeErrorButton
                errorType="UpdateFirmwareError"
                error="FailedToRetrieveFirmwareUpdateInfo"
              />
              <ChangeErrorButton errorType="UpdateFirmwareError" error="FirmwareUpToDate" />
              <ChangeErrorButton errorType="UpdateFirmwareError" error="McuVersionNotFound" />
              <ChangeErrorButton
                errorType="UpdateFirmwareError"
                error="TooManyMcuOrBootloaderFlashes"
              />
            </Flex>
          </ScrollView>
        </Flex>
      ) : (
        <Flex position="absolute" bottom={10} mx={8} borderRadius={5}>
          <Button type="main" size="small" onPress={() => setIsDebugBoardOpen(true)}>
            +
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
