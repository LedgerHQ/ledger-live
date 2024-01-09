import React, { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { getDeviceModel } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";
import AllowManagerDrawer from "./AllowManagerDrawer";
import GenuineCheckErrorDrawer from "./GenuineCheckErrorDrawer";
import GenuineCheckNonGenuineDrawer from "./GenuineCheckNonGenuineDrawer";
import { TrackScreen, track } from "~/analytics";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import FirmwareUpdateAvailableDrawer from "./FirmwareUpdateAvailableDrawer";
import { Linking } from "react-native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { LanguagePrompt } from "./LanguagePrompt";
import { NavigatorName, ScreenName } from "~/const";
import { StackNavigationProp } from "@react-navigation/stack";
import type { UpdateStep } from "../FirmwareUpdate";
import { urls } from "~/utils/urls";
import EarlySecurityCheckBody from "./EarlySecurityCheckBody";

const LOCKED_DEVICE_TIMEOUT_MS = 1000;

// Represents the UI status of each check step, used by CheckCard
export type UiCheckStatus =
  | "inactive"
  | "active"
  | "completed"
  | "genuineCheckRefused"
  | "firmwareUpdateRefused"
  | "error";

export type Step = "idle" | "genuine-check" | "firmware-update-check" | "firmware-updating";

// Represents the status of the genuine check from which is derived the displayed UI and if the genuine check hook can be started or not
type GenuineCheckStatus = "unchecked" | "ongoing" | "completed" | "error" | "non-genuine";
// Defines which drawer should be displayed during the genuine check
type GenuineCheckUiDrawerStatus = "none" | "allow-manager" | "non-genuine" | "genuine-check-error";

// Represents the status of the firmware check from which is derived the displayed UI and if the genuine check hook can be started or not
type FirmwareUpdateCheckStatus =
  | "unchecked"
  | "ongoing"
  | "updating"
  | "completed"
  | "error"
  | "refused";
// Defines which drawer should be displayed during the firmware check
type FirmwareUpdateUiDrawerStatus = "none" | "new-firmware-available";

export type EarlySecurityCheckProps = {
  /**
   * A `Device` object
   */
  device: Device;

  /**
   * Function called once the ESC step is finished
   */
  notifyOnboardingEarlyCheckEnded: () => void;

  /**
   * Called when the device is not in a correct state anymore, for ex when a firmware update has completed and the device probably restarted
   */
  notifyEarlySecurityCheckShouldReset: (currentState: {
    isAlreadyGenuine: boolean;
    isPreviousUpdateCancelled: boolean;
  }) => void;

  /**
   * To tell the ESC that there is no need to do a genuine check (optional)
   *
   * This will bypass the (idle and) genuine check step and go directly to the firmware update check.
   * Only useful when the EarlySecurityCheck component is mounting.
   */
  isAlreadyGenuine?: boolean;

  /**
   * To tell the ESC that there is no need to re display the FW update drawer (optional)
   */
  isPreviousUpdateCancelled?: boolean;

  /**
   * Function to cancel the onboarding
   */
  onCancelOnboarding: () => void;
};

/**
 * Component representing the early security checks step, which polls the current device state
 * to display correctly information about the onboarding to the user
 */
export const EarlySecurityCheck: React.FC<EarlySecurityCheckProps> = ({
  device,
  notifyOnboardingEarlyCheckEnded,
  notifyEarlySecurityCheckShouldReset,
  isAlreadyGenuine = false,
  isPreviousUpdateCancelled = false,
  onCancelOnboarding,
}) => {
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  // If the device is genuine, puts the current step to `genuine-check` and it will automatically go to next step
  // as the `genuineCheckStatus` is also set as `completed`.
  const [currentStep, setCurrentStep] = useState<Step>(isAlreadyGenuine ? "genuine-check" : "idle");

  // Genuine check status state from which will be derived the displayed UI and if the genuine check hook can be started / is ongoing etc.
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<GenuineCheckStatus>(
    isAlreadyGenuine ? "completed" : "unchecked",
  );

  const [firmwareUpdateCheckStatus, setFirmwareUpdateCheckStatus] =
    useState<FirmwareUpdateCheckStatus>("unchecked");

  // Not a real "device action" but we get: permission requested, granted and result.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckStatus === "ongoing",
    deviceId: device.deviceId,
    lockedDeviceTimeoutMs: LOCKED_DEVICE_TIMEOUT_MS,
  });

  const {
    state: {
      firmwareUpdateContext: latestFirmware,
      deviceInfo,
      error: getLatestAvailableFirmwareError,
      status: getLatestAvailableFirmwareStatus,
      lockedDevice: getLatestAvailableFirmwareLockedDevice,
    },
  } = useGetLatestAvailableFirmware({
    isHookEnabled: firmwareUpdateCheckStatus === "ongoing",
    deviceId: device.deviceId,
  });

  const onStartChecks = useCallback(() => {
    setCurrentStep("genuine-check");
  }, []);

  const onGenuineCheckLearnMore = useCallback(() => {
    track("button_clicked", {
      button: "Learn more about Genuine Check",
    });
    Linking.openURL(urls.genuineCheck.learnMore);
  }, []);

  const onRetryGenuineCheck = useCallback(() => {
    track("button_clicked", {
      button: "Retry genuine check",
    });
    resetGenuineCheckState();
    setGenuineCheckStatus("unchecked");
  }, [resetGenuineCheckState]);

  const onCancelGenuineCheck = useCallback(() => {
    track("button_clicked", {
      button: "Cancel onboarding",
    });

    onCancelOnboarding();
  }, [onCancelOnboarding]);

  const onSkipFirmwareUpdate = useCallback(() => {
    track("button_clicked", {
      button: "Skip software update",
    });

    notifyOnboardingEarlyCheckEnded();
  }, [notifyOnboardingEarlyCheckEnded]);

  const onBackFromUpdate = useCallback(
    (updateState: UpdateStep) => {
      log("EarlySecurityCheck", "Back from update", { updateState });
      navigation.goBack();

      // In the 3 following cases we resets the ESC:
      // - user left the firmware update flow before the end
      // - the fw update was successful
      // - the user returned after an error during the fw update
      notifyEarlySecurityCheckShouldReset({
        isAlreadyGenuine: true,
        isPreviousUpdateCancelled: updateState !== "completed",
      });
    },
    [navigation, notifyEarlySecurityCheckShouldReset],
  );

  const onUpdateFirmware = useCallback(() => {
    track("button_clicked", {
      button: "Update device OS Version",
      firmwareUpdate: {
        version: latestFirmware?.final.name,
      },
    });

    if (deviceInfo && latestFirmware) {
      // Resets the `useGetLatestAvailableFirmware` hook to be able to trigger it again
      setFirmwareUpdateCheckStatus("updating");

      // `push` to make sure the screen is added to the navigation stack, if ever the user was on the manager before doing an update, and we can return
      // to this screen with a `goBack`.
      navigation.push(NavigatorName.Base, {
        screen: NavigatorName.Main,
        params: {
          screen: NavigatorName.Manager,
          params: {
            screen: ScreenName.FirmwareUpdate,
            params: {
              device,
              deviceInfo,
              firmwareUpdateContext: latestFirmware,
              onBackFromUpdate,
              isBeforeOnboarding: true,
            },
          },
        },
      });
    }
    // It should never happen
    else {
      log(
        "EarlySecurityCheck",
        `Error: trying to update firmware without a deviceInfo ${JSON.stringify(
          deviceInfo,
        )} or a firmwareUpdateContext: ${JSON.stringify(latestFirmware)}`,
      );
      setFirmwareUpdateCheckStatus("completed");
    }
  }, [device, deviceInfo, latestFirmware, navigation, onBackFromUpdate]);

  // Check steps entry points
  useEffect(() => {
    // Genuine check start and retry entry point
    if (currentStep === "genuine-check" && genuineCheckStatus === "unchecked") {
      setGenuineCheckStatus("ongoing");
    }
    // Firmware update check start point
    else if (
      ["completed", "skipped"].includes(genuineCheckStatus) &&
      currentStep === "genuine-check"
    ) {
      setCurrentStep("firmware-update-check");
      setFirmwareUpdateCheckStatus("ongoing");
    }
  }, [currentStep, genuineCheckStatus]);

  // ***** Handles check states *****
  // UI states
  let currentDisplayedDrawer: GenuineCheckUiDrawerStatus | FirmwareUpdateUiDrawerStatus = "none";
  let genuineCheckUiStepStatus: UiCheckStatus = "inactive";
  let firmwareUpdateUiStepStatus: UiCheckStatus = "inactive";

  // Handles genuine check states logic (both check state and UI state)
  if (currentStep === "genuine-check") {
    if (genuineCheckStatus === "ongoing") {
      genuineCheckUiStepStatus = "active";
      currentDisplayedDrawer = "none";

      // Updates the genuineCheckStatus
      if (genuineCheckError) {
        log("EarlySecurityCheck", "Failed to run genuine check:", genuineCheckError.message);
        setGenuineCheckStatus("error");
      } else if (genuineState === "genuine") {
        setGenuineCheckStatus("completed");
      } else if (genuineState === "non-genuine") {
        log("EarlySecurityCheck", "Device not genuine");
        setGenuineCheckStatus("non-genuine");
      }

      // Updates the displayed drawer and UI state
      if (devicePermissionState === "unlock-needed") {
        // As the PIN has not been set before the ESC, the "unlock-needed" happens if the device is powered off.
        // But an error `CantOpenDevice` should be triggered quickly after.
        log("EarlySecurityCheck", "Genuine check permission state set to unlock-needed");
      } else if (devicePermissionState === "requested") {
        currentDisplayedDrawer = "allow-manager";
      } else if (devicePermissionState === "refused") {
        currentDisplayedDrawer = "none";
        genuineCheckUiStepStatus = "genuineCheckRefused";
      }
    } else if (genuineCheckStatus === "error") {
      // Currently genuine check error or refused is handled in the same way. This can be changed in the future.
      currentDisplayedDrawer = "genuine-check-error";
    } else if (genuineCheckStatus === "non-genuine") {
      currentDisplayedDrawer = "non-genuine";
    }
  }
  // `currentStep` can be any value for those UI updates
  if (genuineCheckStatus === "completed") {
    genuineCheckUiStepStatus = "completed";
  } else if (["error", "non-genuine"].includes(genuineCheckStatus)) {
    genuineCheckUiStepStatus = "error";
  }

  // Handles firmware update check UI logic
  if (currentStep === "firmware-update-check") {
    if (firmwareUpdateCheckStatus === "ongoing") {
      firmwareUpdateUiStepStatus = "active";
      currentDisplayedDrawer = "none";

      // Updates the firmwareUpdateCheckStatus
      // If the current error triggered a retry attempt, does not display failure
      if (
        getLatestAvailableFirmwareError &&
        !(
          getLatestAvailableFirmwareError.type === "SharedError" &&
          getLatestAvailableFirmwareError.retrying
        )
      ) {
        log(
          "EarlySecurityCheck",
          "Failed to retrieve latest firmware version with error:",
          getLatestAvailableFirmwareError.name,
        );
        setFirmwareUpdateCheckStatus("error");
      } else if (getLatestAvailableFirmwareStatus === "no-available-firmware") {
        setFirmwareUpdateCheckStatus("completed");
      }

      if (getLatestAvailableFirmwareLockedDevice) {
        // The device has no PIN in the ESC.
        // Plus if the error is an `UnresponsiveDeviceError`: it would probably means the user
        // cancelled a firmware update previously and came back to the ESC (with a device in an incorrect state).
        log(
          "EarlySecurityCheck",
          "Device considered locked while getting latest available firmware",
          { error: getLatestAvailableFirmwareError },
        );
      }

      // Updates the UI
      if (getLatestAvailableFirmwareStatus === "available-firmware" && latestFirmware) {
        // Only for QA to have always the same 1-way path: on infinite loop firmware
        // the path x.x.x-il2 -> x.x.x-il0 does not trigger a firmware update during the ESC
        if (
          getLatestAvailableFirmwareStatus === "available-firmware" &&
          latestFirmware?.final.name.endsWith("-il0") &&
          deviceInfo?.version.endsWith("-il2")
        ) {
          setFirmwareUpdateCheckStatus("completed");
          currentDisplayedDrawer = "none";
        } else if (isPreviousUpdateCancelled) {
          // When isPreviousUpdateCancelled is true, it indicates that the user is already informed
          // about the new firmware update, so there's no need to show the drawer again
          currentDisplayedDrawer = "none";
          firmwareUpdateUiStepStatus = "firmwareUpdateRefused";
        } else {
          currentDisplayedDrawer = "new-firmware-available";
        }
      } else {
        currentDisplayedDrawer = "none";
      }
    } else if (firmwareUpdateCheckStatus === "refused") {
      currentDisplayedDrawer = "none";
      firmwareUpdateUiStepStatus = "firmwareUpdateRefused";
    }
  }
  // `currentStep` can be any value for those UI updates
  if (firmwareUpdateCheckStatus === "completed") {
    firmwareUpdateUiStepStatus = "completed";
  } else if (firmwareUpdateCheckStatus === "error") {
    firmwareUpdateUiStepStatus = "error";
  }

  // Depends on `currentDisplayedDrawer` because of how the drawer `onClose` works
  const onCloseUpdateAvailable = useCallback(() => {
    // Then we're sure that the user clicks on the close button
    if (currentDisplayedDrawer === "new-firmware-available") {
      setFirmwareUpdateCheckStatus("refused");
    }
  }, [currentDisplayedDrawer]);

  const latestAvailableFirmwareVersion = latestFirmware?.final.version;

  const hasLatestAvailableFirmwareStatus =
    getLatestAvailableFirmwareStatus === "available-firmware" && !!latestAvailableFirmwareVersion;

  return (
    <>
      {firmwareUpdateUiStepStatus === "completed" ? (
        <TrackScreen name="Success: device is genuine and OS check up to date" />
      ) : hasLatestAvailableFirmwareStatus ? (
        <TrackScreen name="Update required: new OS Version is available" key="fw-available" />
      ) : genuineCheckUiStepStatus === "genuineCheckRefused" ? (
        <TrackScreen name="Error: Genuine check refused on device" key="refused" />
      ) : currentStep === "idle" ? (
        <TrackScreen name="Verify device" key="verify" />
      ) : currentStep === "genuine-check" ? (
        <TrackScreen name="Beginning of genuine check" key="beginning-genuine" />
      ) : currentStep === "firmware-update-check" ? (
        <TrackScreen name="Beginning of OS version check" key="beginning-os" />
      ) : null}
      <AllowManagerDrawer isOpen={currentDisplayedDrawer === "allow-manager"} device={device} />
      <GenuineCheckErrorDrawer
        productName={productName}
        isOpen={currentDisplayedDrawer === "genuine-check-error"}
        error={genuineCheckError}
        onRetry={onRetryGenuineCheck}
        onCancel={onCancelGenuineCheck}
      />
      <GenuineCheckNonGenuineDrawer
        productName={productName}
        isOpen={currentDisplayedDrawer === "non-genuine"}
        onClose={onCancelGenuineCheck}
      />
      <FirmwareUpdateAvailableDrawer
        productName={productName}
        firmwareVersion={latestFirmware?.final?.version ?? ""}
        isOpen={currentDisplayedDrawer === "new-firmware-available"}
        onUpdate={onUpdateFirmware}
        onClose={onCloseUpdateAvailable}
      />
      <EarlySecurityCheckBody
        productName={productName}
        currentStep={currentStep}
        onStartChecks={onStartChecks}
        genuineCheckUiStepStatus={genuineCheckUiStepStatus}
        onGenuineCheckLearnMore={onGenuineCheckLearnMore}
        onRetryGenuineCheck={onRetryGenuineCheck}
        firmwareUpdateUiStepStatus={firmwareUpdateUiStepStatus}
        hasLatestAvailableFirmwareStatus={hasLatestAvailableFirmwareStatus}
        latestAvailableFirmwareVersion={latestAvailableFirmwareVersion}
        notifyOnboardingEarlyCheckEnded={notifyOnboardingEarlyCheckEnded}
        onSkipFirmwareUpdate={onSkipFirmwareUpdate}
        onUpdateFirmware={onUpdateFirmware}
      />
      <LanguagePrompt device={device} />
    </>
  );
};
