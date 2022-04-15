import React, { useEffect, useCallback, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { NativeModules } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { Button, Icons } from "@ledgerhq/native-ui";
import {
  BackgroundEvent,
  nextBackgroundEventSelector,
} from "../../reducers/appstate";
import {
  clearBackgroundEvents,
  dequeueBackgroundEvent,
} from "../../actions/appstate";
import BottomModal from "../BottomModal";
import GenericErrorView from "../GenericErrorView";
import { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import useLatestFirmware from "../../hooks/useLatestFirmware";
import ConfirmRecoveryStep from "./ConfirmRecoveryStep";
import FlashMcuStep from "./FlashMcuStep";
import FirmwareUpdatedStep from "./FirmwareUpdatedStep";
import ConfirmPinStep from "./ConfirmPinStep";
import ConfirmUpdateStep from "./ConfirmUpdateStep";
import DownloadingUpdateStep from "./DownloadingUpdateStep";
import { track } from "../../analytics";

type Props = {
  device: Device;
  deviceInfo: DeviceInfo;
  isOpen: boolean;
  onClose: (restoreApps?: boolean) => void;
};

const BluetoothNotSupportedError: Error = {
  name: "FwUpdateBluetoothNotSupported",
  message: "",
};

type FwUpdateStep =
  | "confirmRecoveryBackup"
  | "downloadingUpdate"
  | "error"
  | "flashingMcu"
  | "confirmPin"
  | "confirmUpdate"
  | "firmwareUpdated";
type FwUpdateState = {
  step: FwUpdateStep;
  progress?: number;
  error?: Error;
  installing?: string | null;
};

// reducer for the firmware update state machine
const fwUpdateStateReducer = (
  state: FwUpdateState,
  event: BackgroundEvent | { type: "reset"; wired: boolean },
): FwUpdateState => {
  switch (event.type) {
    case "confirmPin":
      return { step: "confirmPin" };
    case "downloadingUpdate":
      return { step: "downloadingUpdate", progress: event.progress };
    case "confirmUpdate":
      return { step: "confirmUpdate" };
    case "flashingMcu":
      return {
        step: "flashingMcu",
        progress: event.progress,
        installing: event.installing,
      };
    case "firmwareUpdated":
      return { step: "firmwareUpdated" };
    case "error":
      return { step: "error", error: event.error };
    case "reset":
      return {
        step: event.wired ? "confirmRecoveryBackup" : "error",
        progress: undefined,
        error: event.wired ? undefined : BluetoothNotSupportedError,
        installing: undefined,
      };
    default:
      return { ...state };
  }
};

export default function FirmwareUpdate({
  device,
  deviceInfo,
  onClose,
  isOpen,
}: Props) {
  const nextBackgroundEvent = useSelector(nextBackgroundEventSelector);
  const dispatch = useDispatch();
  const latestFirmware = useLatestFirmware(deviceInfo);

  const { t } = useTranslation();

  const [state, dispatchEvent] = useReducer(fwUpdateStateReducer, {
    step: device.wired ? "confirmRecoveryBackup" : "error",
    progress: undefined,
    error: device.wired ? undefined : BluetoothNotSupportedError,
    installing: undefined,
  });

  const { step, progress, error, installing } = state;

  const onReset = useCallback(() => {
    dispatchEvent({ type: "reset", wired: device.wired });
    dispatch(clearBackgroundEvents());
    NativeModules.BackgroundRunner.stop();
  }, [dispatch]);

  const onTryClose = useCallback(
    (restoreApps: boolean) => {
      // only allow closing of the modal when the update is not in an intermediate step
      if (
        step === "confirmRecoveryBackup" ||
        step === "firmwareUpdated" ||
        step === "error"
      ) {
        // prevent the firmware update modal from opening again without the user explicit clicking on update
        onClose(restoreApps);
      }
    },
    [step],
  );

  const onCloseAndReinstall = useCallback(() => onTryClose(true), [onTryClose]);
  const onCloseSilently = useCallback(() => onTryClose(false), [onTryClose]);

  useEffect(() => {
    // reset the state whenever we re-open the modal
    if (isOpen) {
      onReset();
    }
  }, [isOpen, onReset]);

  useEffect(() => {
    if (!nextBackgroundEvent) return;

    dispatchEvent(nextBackgroundEvent);
    dispatch(dequeueBackgroundEvent());
  }, [nextBackgroundEvent, dispatch, dispatchEvent]);

  useEffect(() => {
    if(step === "error") {
      track("FirmwareUpdateError", error ?? null);
    }
  }, [step]);

  const launchUpdate = useCallback(() => {
    if (latestFirmware) {
      NativeModules.BackgroundRunner.start(
        device.deviceId,
        JSON.stringify(latestFirmware),
      );
      dispatchEvent({ type: "downloadingUpdate", progress: 0 });
    }
  }, [latestFirmware]);

  const firmwareVersion = latestFirmware?.final?.name ?? "";

  return (
    <BottomModal
      id="DeviceActionModal"
      isOpened={isOpen}
      onClose={onCloseSilently}
      onModalHide={onCloseSilently}
    >
      {step === "confirmRecoveryBackup" && (
        <ConfirmRecoveryStep
          onCancel={onCloseSilently}
          onContinue={launchUpdate}
          firmwareVersion={firmwareVersion}
          firmwareNotes={latestFirmware?.osu?.notes}
        />
      )}
      {step === "flashingMcu" && (
        <FlashMcuStep progress={progress} installing={installing} />
      )}
      {step === "firmwareUpdated" && (
        <FirmwareUpdatedStep onReinstallApps={onCloseAndReinstall} />
      )}
      {step === "error" && (
        <>
          <GenericErrorView
            error={error as Error}
            withDescription={false}
            hasExportLogButton={error !== BluetoothNotSupportedError }
            Icon={error === BluetoothNotSupportedError ? Icons.UsbMedium : undefined}
            iconColor="neutral.c100"
          />
          {error !== BluetoothNotSupportedError && (
            <Button
              type="main"
              alignSelf="stretch"
              mt={5}
              onPress={onCloseAndReinstall}
            >
              {t("FirmwareUpdate.reinstallApps")}
            </Button>
          )}
        </>
      )}
      {step === "confirmPin" && <ConfirmPinStep device={device} />}
      {step === "confirmUpdate" && (
        <ConfirmUpdateStep
          device={device}
          deviceInfo={deviceInfo}
          latestFirmware={latestFirmware}
        />
      )}
      {step === "downloadingUpdate" && (
        <DownloadingUpdateStep progress={progress} />
      )}
    </BottomModal>
  );
}
