import { Image } from "react-native";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  updateFirmwareActionArgs,
  UpdateFirmwareActionState,
} from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  Alert,
  Flex,
  IconBadge,
  IconsLegacy,
  Text,
  VerticalStepper,
  ItemStatus,
  Icons,
} from "@ledgerhq/native-ui";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import { Item } from "@ledgerhq/native-ui/components/Layout/List/types";
import { DeviceInfo, FirmwareUpdateContext, languageIds } from "@ledgerhq/types-live";
import { useBatteryStatuses } from "@ledgerhq/live-common/deviceSDK/hooks/useBatteryStatuses";
import { BatteryStatusTypes } from "@ledgerhq/live-common/hw/getBatteryStatus";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Observable } from "rxjs";
import { updateMainNavigatorVisibility } from "~/actions/appstate";
import {
  AllowManager,
  ConfirmFirmwareUpdate,
  FinishFirmwareUpdate,
  FirmwareUpdateDenied,
  DeviceActionError,
} from "~/components/DeviceAction/common";
import QueuedDrawer from "~/components/QueuedDrawer";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "~/components/RootNavigator/types/ManagerNavigator";
import { ScreenName } from "~/const";
import {
  renderAllowLanguageInstallation,
  renderConnectYourDevice,
  renderImageCommitRequested,
  renderImageLoadRequested,
} from "~/components/DeviceAction/rendering";
import {
  UpdateStep,
  useUpdateFirmwareAndRestoreSettings,
} from "./useUpdateFirmwareAndRestoreSettings";
import { TrackScreen } from "~/analytics";
import ImageHexProcessor from "~/components/CustomImage/ImageHexProcessor";
import { targetDataDimensions } from "../CustomImage/shared";
import { ProcessorPreviewResult } from "~/components/CustomImage/ImageProcessor";
import { ImageSourceContext } from "~/components/CustomImage/StaxFramedImage";
import Button from "~/components/wrappedUi/Button";
import Link from "~/components/wrappedUi/Link";
import { RestoreStepDenied } from "./RestoreStepDenied";
import UpdateReleaseNotes from "./UpdateReleaseNotes";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import BatteryWarningDrawer from "./BatteryWarningDrawer";

const requiredBatteryStatuses = [
  BatteryStatusTypes.BATTERY_PERCENTAGE,
  BatteryStatusTypes.BATTERY_FLAGS,
];

// Screens/components navigating to this screen shouldn't know the implementation fw update
// -> re-exporting useful types.
export type { UpdateStep };

export type FirmwareUpdateProps = {
  device: Device;
  deviceInfo: DeviceInfo;
  firmwareUpdateContext: FirmwareUpdateContext;

  /**
   * To adapt the firmware update in case the device is starting its onboarding and it's normal it is not yet seeded.
   * If set to true, short-circuit some steps that are unnecessary
   */
  isBeforeOnboarding?: boolean;

  /**
   * Called when the user leaves the firmware update screen
   *
   * Two possible reasons:
   * - the update has completed
   * - the user quits before the completion of the update
   *
   * @param updateState The current state of the update when the user leaves the screen
   */
  onBackFromUpdate?: (updateState: UpdateStep) => void;

  updateFirmwareAction?: (args: updateFirmwareActionArgs) => Observable<UpdateFirmwareActionState>;
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<ManagerNavigatorStackParamList, ScreenName.FirmwareUpdate>
>;

type UpdateSteps = {
  prepareUpdate: Item;
  installUpdate: Item;
  restoreAppsAndSettings: Item;
};

const CloseWarning = ({
  onPressContinue,
  onPressQuit,
}: {
  onPressContinue: () => void;
  onPressQuit: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Flex alignItems="center" justifyContent="center" px={1} mt={7}>
      <TrackScreen category="Error: update not complete yet" type="drawer" refreshSource={false} />
      <IconBadge iconColor="warning.c100" iconSize={32} Icon={IconsLegacy.WarningSolidMedium} />
      <Text fontSize={24} fontWeight="semiBold" textAlign="center" mt={6}>
        {t("FirmwareUpdate.updateNotYetComplete")}
      </Text>
      <Text fontSize={14} textAlign="center" color="neutral.c80" mt={6}>
        {t("FirmwareUpdate.updateNotYetCompleteDescription")}
      </Text>
      <Button
        event="button_clicked"
        eventProperties={{
          button: "Continue update",
          page: "Firmware update",
          drawer: "Error: update not complete yet",
        }}
        type="main"
        outline={false}
        onPress={onPressContinue}
        mt={8}
        alignSelf="stretch"
      >
        {t("FirmwareUpdate.continueUpdate")}
      </Button>
      <Button
        event="button_clicked"
        eventProperties={{
          button: "Exit update",
          page: "Firmware update",
          drawer: "Error: update not complete yet",
        }}
        type="default"
        outline={false}
        onPress={onPressQuit}
        mt={6}
        alignSelf="stretch"
      >
        {t("FirmwareUpdate.quitUpdate")}
      </Button>
    </Flex>
  );
};

export const FirmwareUpdate = ({
  device,
  deviceInfo,
  firmwareUpdateContext,
  onBackFromUpdate,
  updateFirmwareAction,
  isBeforeOnboarding = false,
}: FirmwareUpdateProps) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { dark } = useTheme();
  const theme: "dark" | "light" = dark ? "dark" : "light";
  const dispatch = useDispatch();

  const productName = getDeviceModel(device.modelId).productName;

  const [fullUpdateComplete, setFullUpdateComplete] = useState(false);
  const [showBatteryWarningDrawer, setShowBatteryWarningDrawer] = useState<boolean>(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState<boolean>(true);

  const {
    requestCompleted: batteryRequestCompleted,
    batteryStatusesState,
    triggerRequest: triggerBatteryCheck,
    cancelRequest: cancelBatteryCheck,
    isBatteryLow,
    lowBatteryPercentage,
  } = useBatteryStatuses({
    deviceId: device.deviceId,
    statuses: requiredBatteryStatuses,
  });

  const {
    startUpdate,
    connectManagerState,
    updateActionState,
    updateStep,
    retryCurrentStep,
    staxFetchImageState,
    staxLoadImageState,
    installLanguageState,
    restoreAppsState,
    noOfAppsToReinstall,
    deviceLockedOrUnresponsive,
    restoreStepDeniedError,
    hasReconnectErrors,
    userSolvableError,
    skipCurrentRestoreStep,
  } = useUpdateFirmwareAndRestoreSettings({
    updateFirmwareAction,
    device,
    deviceInfo,
    isBeforeOnboarding,
  });

  const [staxImageSource, setStaxImageSource] =
    useState<React.ComponentProps<typeof Image>["source"]>();
  const handleStaxImageSourceLoaded = useCallback((res: ProcessorPreviewResult) => {
    setStaxImageSource({ uri: res.imageBase64DataUri });
  }, []);
  const staxImageSourceProviderValue = useMemo(
    () => ({
      source: staxImageSource,
    }),
    [staxImageSource],
  );

  const quitUpdate = useCallback(() => {
    if (!batteryRequestCompleted) cancelBatteryCheck();

    if (onBackFromUpdate) {
      onBackFromUpdate(updateStep);
    } else {
      navigation.goBack();
    }
  }, [batteryRequestCompleted, cancelBatteryCheck, navigation, onBackFromUpdate, updateStep]);

  useEffect(() => {
    if (updateStep === "completed") {
      const completeTimeout = setTimeout(() => setFullUpdateComplete(true), 3000);

      return () => clearTimeout(completeTimeout);
    }

    return undefined;
  });

  const restoreSteps = useMemo(() => {
    const steps = [];

    if (deviceInfo.languageId !== languageIds.english) {
      steps.push({
        status: {
          start: ItemStatus.inactive,
          appsBackup: ItemStatus.inactive,
          imageBackup: ItemStatus.inactive,
          firmwareUpdate: ItemStatus.inactive,
          languageRestore: ItemStatus.active,
          imageRestore: ItemStatus.completed,
          appsRestore: ItemStatus.completed,
          completed: ItemStatus.completed,
        }[updateStep],
        progress: installLanguageState.progress,
        title: t("FirmwareUpdate.steps.restoreSettings.restoreLanguage"),
      });
    }

    if (staxFetchImageState.hexImage) {
      steps.push({
        status: {
          start: ItemStatus.inactive,
          appsBackup: ItemStatus.inactive,
          imageBackup: ItemStatus.inactive,
          firmwareUpdate: ItemStatus.inactive,
          languageRestore: ItemStatus.inactive,
          imageRestore: ItemStatus.active,
          appsRestore: ItemStatus.completed,
          completed: ItemStatus.completed,
        }[updateStep],
        progress: staxLoadImageState.progress,
        title: t("FirmwareUpdate.steps.restoreSettings.restoreLockScreenPicture"),
      });
    }

    if (noOfAppsToReinstall > 0) {
      steps.push({
        status: {
          start: ItemStatus.inactive,
          appsBackup: ItemStatus.inactive,
          imageBackup: ItemStatus.inactive,
          firmwareUpdate: ItemStatus.inactive,
          languageRestore: ItemStatus.inactive,
          imageRestore: ItemStatus.inactive,
          appsRestore: ItemStatus.active,
          completed: ItemStatus.completed,
        }[updateStep],
        progress: restoreAppsState.itemProgress,
        title:
          t("FirmwareUpdate.steps.restoreSettings.installingApps") +
          ` ${
            !restoreAppsState.listedApps
              ? 0
              : restoreAppsState.installQueue !== undefined &&
                restoreAppsState.installQueue.length > 0
              ? noOfAppsToReinstall - (restoreAppsState.installQueue.length - 1)
              : noOfAppsToReinstall
          }/${noOfAppsToReinstall}` +
          (restoreAppsState.installQueue !== undefined && restoreAppsState.installQueue.length > 0
            ? ` - ${restoreAppsState.installQueue[0]}`
            : ""),
      });
    }

    return steps;
  }, [
    updateStep,
    installLanguageState.progress,
    t,
    staxFetchImageState.hexImage,
    staxLoadImageState.progress,
    restoreAppsState.listedApps,
    restoreAppsState.itemProgress,
    restoreAppsState.installQueue,
    noOfAppsToReinstall,
    deviceInfo.languageId,
  ]);

  const defaultSteps: UpdateSteps = useMemo(
    () => ({
      prepareUpdate: {
        status: ItemStatus.inactive,
        title: isBeforeOnboarding
          ? t("FirmwareUpdate.steps.prepareUpdate.earlySecurityCheck.titlePreparingUpdate")
          : t("FirmwareUpdate.steps.prepareUpdate.titleBackingUp"),
        renderBody: () => (
          <>
            <TrackScreen category={"Update device - Step 1: preparing updates for install"} />
            <Text variant="bodyLineHeight" color="neutral.c80">
              {isBeforeOnboarding
                ? t("FirmwareUpdate.steps.prepareUpdate.earlySecurityCheck.description", {
                    deviceName: productName,
                  })
                : t("FirmwareUpdate.steps.prepareUpdate.description", {
                    deviceName: productName,
                  })}
            </Text>
          </>
        ),
      },
      installUpdate: {
        status: ItemStatus.inactive,
        title: t("FirmwareUpdate.steps.installUpdate.titleInactive"),
        renderBody: () => (
          <>
            <TrackScreen category={"Update device - Step 2: installing updates"} avoidDuplicates />
            <Text variant="bodyLineHeight" color="neutral.c80">
              {t("FirmwareUpdate.steps.installUpdate.description", {
                deviceName: productName,
              })}
            </Text>
          </>
        ),
      },
      restoreAppsAndSettings: {
        status: ItemStatus.inactive,
        title: isBeforeOnboarding
          ? t("FirmwareUpdate.steps.restoreSettings.earlySecurityCheck.titleInactive")
          : t("FirmwareUpdate.steps.restoreSettings.titleInactive"),
        renderBody: () => (
          <Flex>
            <TrackScreen category={"Update device - Step 3: restore apps and settings"} />
            <Text variant="bodyLineHeight" color="neutral.c80">
              {isBeforeOnboarding
                ? t("FirmwareUpdate.steps.restoreSettings.earlySecurityCheck.description")
                : t("FirmwareUpdate.steps.restoreSettings.description")}
            </Text>
            {restoreSteps.length > 0 && <VerticalStepper nested steps={restoreSteps} />}
          </Flex>
        ),
      },
    }),
    [t, isBeforeOnboarding, productName, restoreSteps],
  );

  useEffect(() => {
    dispatch(updateMainNavigatorVisibility(false));
    return () => {
      // this works because the firmware update screen has only one way out which is going back
      // and it will unmount the screen and put the visibility back on
      // if there other navigations for the firmware update in the future we might need to adapt this
      dispatch(updateMainNavigatorVisibility(true));
    };
  }, [dispatch]);

  const [isCloseWarningOpen, setIsCloseWarningOpen] = useState(false);

  const isAllowedToClose = useMemo(() => {
    const closableSteps: UpdateFirmwareActionState["step"][] = [
      "firmwareUpdateCompleted",
      "preparingUpdate",
      "installOsuDevicePermissionDenied",
    ];
    // TODO: review this with all the actions states

    return closableSteps.includes(updateActionState.step);
  }, [updateActionState.step]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => {
            if (isAllowedToClose) {
              quitUpdate();
            } else {
              setIsCloseWarningOpen(true);
            }
          }}
          Icon={IconsLegacy.CloseMedium}
        />
      ),
    });
  }, [navigation, quitUpdate, isAllowedToClose]);

  // this will depend on the steps we go through during the update
  const [totalNumberOfSteps, setTotalNumberOfSteps] = useState(2);

  const steps = useMemo(() => {
    const newSteps: UpdateSteps = {
      prepareUpdate: { ...defaultSteps.prepareUpdate },
      installUpdate: { ...defaultSteps.installUpdate },
      restoreAppsAndSettings: { ...defaultSteps.restoreAppsAndSettings },
    };

    // sets the install step as active
    const setInstallStepActive = () => {
      newSteps.prepareUpdate.status = ItemStatus.completed;
      newSteps.installUpdate.status = ItemStatus.active;
    };

    // update the progress value of the prepare step
    const updatePrepareStepProgress = () => {
      newSteps.prepareUpdate.progress = updateActionState.progress;
    };

    // update the progress value of the install step
    const updateInstallStepProgress = () => {
      newSteps.installUpdate.progress = updateActionState.progress;
    };

    // clear the progress value of the install step (infinite spinner)
    const clearInstallStepProgress = () => {
      newSteps.installUpdate.progress = undefined;
    };

    // sets the restore step as active
    const setRestoreStepActive = () => {
      newSteps.prepareUpdate.status = ItemStatus.completed;
      newSteps.installUpdate.status = ItemStatus.completed;
      newSteps.restoreAppsAndSettings.status = ItemStatus.active;
    };

    switch (updateActionState.step) {
      case "installingOsu":
        updatePrepareStepProgress();
        newSteps.prepareUpdate.title = t("FirmwareUpdate.steps.prepareUpdate.titleTransferring");
        newSteps.prepareUpdate.status = ItemStatus.active;
        break;
      case "preparingUpdate":
      case "allowSecureChannelRequested":
        newSteps.prepareUpdate.status = ItemStatus.active;
        break;
      case "flashingBootloader":
        setInstallStepActive();
        // if we go through a bootloader flash it means there it will be 3 steps to the update
        setTotalNumberOfSteps(3);
        updateInstallStepProgress();
        newSteps.installUpdate.title =
          t("FirmwareUpdate.steps.installUpdate.titleActive") + ` 1/${totalNumberOfSteps}`;
        break;
      case "flashingMcu":
        setInstallStepActive();
        if (updateActionState.progress === 1) {
          // the last step of the update is always after the flashing of the MCU is completed
          clearInstallStepProgress();
          newSteps.installUpdate.title =
            t("FirmwareUpdate.steps.installUpdate.titleActive") +
            ` ${totalNumberOfSteps}/${totalNumberOfSteps}`;
        } else {
          updateInstallStepProgress();
          newSteps.installUpdate.title =
            t("FirmwareUpdate.steps.installUpdate.titleActive") +
            ` ${totalNumberOfSteps - 1}/${totalNumberOfSteps}`;
        }
        break;
      case "installOsuDevicePermissionGranted":
      case "installOsuDevicePermissionRequested":
        setInstallStepActive();
        break;
      case "firmwareUpdateCompleted":
        setRestoreStepActive();
        break;
      default:
        break;
    }

    return Object.values(newSteps);
  }, [
    defaultSteps.installUpdate,
    defaultSteps.prepareUpdate,
    defaultSteps.restoreAppsAndSettings,
    t,
    totalNumberOfSteps,
    updateActionState.progress,
    updateActionState.step,
  ]);

  const deviceInteractionDisplay = useMemo(() => {
    if (
      deviceLockedOrUnresponsive ||
      hasReconnectErrors ||
      batteryStatusesState.error?.name === "CantOpenDevice" ||
      batteryStatusesState.lockedDevice
    ) {
      return (
        <Flex>
          {renderConnectYourDevice({
            t,
            device,
            theme,
            fullScreen: false,
          })}
          <Button type="main" outline={false} onPress={retryCurrentStep} mt={6} alignSelf="stretch">
            {t("common.retry")}
          </Button>
          <Button type="default" outline={false} onPress={quitUpdate} mt={6}>
            {t("FirmwareUpdate.quitUpdate")}
          </Button>
        </Flex>
      );
    }

    if (batteryStatusesState.error !== null) {
      return (
        <DeviceActionError
          t={t}
          device={device}
          errorName={batteryStatusesState.error?.name ?? "BatteryStatusNotRetrieved"}
          translationContext="FirmwareUpdate.batteryStatusErrors"
        />
      );
    }

    if (staxLoadImageState.imageLoadRequested) {
      return renderImageLoadRequested({
        t,
        device,
        fullScreen: false,
        wording: t("FirmwareUpdate.steps.restoreSettings.imageLoadRequested", {
          deviceName: productName,
        }),
      });
    }

    if (staxLoadImageState.imageCommitRequested) {
      return renderImageCommitRequested({
        t,
        device,
        fullScreen: false,
        wording: t("FirmwareUpdate.steps.restoreSettings.imageCommitRequested", {
          deviceName: productName,
        }),
      });
    }

    if (restoreAppsState.allowManagerRequested) {
      return (
        <AllowManager
          device={device}
          wording={t("FirmwareUpdate.steps.restoreSettings.allowAppsRestoration", {
            deviceName: productName,
          })}
        />
      );
    }

    if (connectManagerState.allowManagerRequested) {
      return <AllowManager device={device} wording={t("DeviceAction.allowSecureConnection")} />;
    }

    if (installLanguageState.languageInstallationRequested) {
      return renderAllowLanguageInstallation({
        t,
        device,
        theme,
        fullScreen: false,
        wording: t("FirmwareUpdate.steps.restoreSettings.allowLanguageInstallation", {
          deviceName: productName,
        }),
      });
    }

    if (restoreStepDeniedError) {
      return (
        <RestoreStepDenied
          device={device}
          onPressRetry={retryCurrentStep}
          onPressSkip={skipCurrentRestoreStep}
          stepDeniedError={restoreStepDeniedError}
          t={t}
        />
      );
    }

    if (userSolvableError) {
      return (
        <DeviceActionError
          device={device}
          t={t}
          errorName={userSolvableError.name}
          translationContext="FirmwareUpdate"
        >
          <TrackScreen
            category={`Error: ${userSolvableError.name}`}
            refreshSource={false}
            type="drawer"
          />
          <Button
            event="button_clicked"
            eventProperties={{
              button: "Retry flow",
              page: "Firmware update",
              drawer: `Error: ${userSolvableError.name}`,
            }}
            type="main"
            outline={false}
            onPress={retryCurrentStep}
            my={6}
            alignSelf="stretch"
          >
            {t("common.retry")}
          </Button>
          <Flex mt={7} alignSelf="stretch">
            <Link
              event="button_clicked"
              eventProperties={{
                button: "Quit flow",
                page: "Firmware update",
                drawer: `Error: ${userSolvableError.name}`,
              }}
              type="main"
              onPress={quitUpdate}
            >
              {t("FirmwareUpdate.quitUpdate")}
            </Link>
          </Flex>
        </DeviceActionError>
      );
    }

    switch (updateActionState.step) {
      case "allowSecureChannelRequested":
        return <AllowManager device={device} wording={t("DeviceAction.allowSecureConnection")} />;
      case "installOsuDevicePermissionRequested":
        return (
          <ConfirmFirmwareUpdate
            device={device}
            currentFirmwareVersion={deviceInfo.version}
            newFirmwareVersion={firmwareUpdateContext.final.name}
            t={t}
          />
        );
      case "allowSecureChannelDenied":
      case "installOsuDevicePermissionDenied":
        return (
          <FirmwareUpdateDenied
            device={device}
            newFirmwareVersion={firmwareUpdateContext.final.name}
            onPressRestart={retryCurrentStep}
            onPressQuit={quitUpdate}
            t={t}
          />
        );
      case "installOsuDevicePermissionGranted":
        // If the device is not yet onboarded, there is no PIN code: no need to display this content
        if (!firmwareUpdateContext.shouldFlashMCU && !isBeforeOnboarding) {
          return <FinishFirmwareUpdate device={device} t={t} />;
        }
        break;
      case "flashingMcu":
        // If the device is not yet onboarded, there is no PIN code: no need to display this content
        if (updateActionState.progress === 1 && !isBeforeOnboarding) {
          return <FinishFirmwareUpdate device={device} t={t} />;
        }
        break;
      default:
        break;
    }

    return undefined;
  }, [
    batteryStatusesState.error,
    batteryStatusesState.lockedDevice,
    deviceLockedOrUnresponsive,
    hasReconnectErrors,
    staxLoadImageState.imageLoadRequested,
    staxLoadImageState.imageCommitRequested,
    restoreAppsState.allowManagerRequested,
    connectManagerState.allowManagerRequested,
    installLanguageState.languageInstallationRequested,
    restoreStepDeniedError,
    userSolvableError,
    updateActionState.step,
    updateActionState.progress,
    t,
    device,
    theme,
    retryCurrentStep,
    quitUpdate,
    productName,
    skipCurrentRestoreStep,
    firmwareUpdateContext.final.name,
    firmwareUpdateContext.shouldFlashMCU,
    isBeforeOnboarding,
    deviceInfo.version,
  ]);

  useEffect(() => {
    if (!batteryRequestCompleted) return;

    isBatteryLow ? setShowBatteryWarningDrawer(true) : startUpdate();
  }, [batteryRequestCompleted, isBatteryLow, startUpdate]);

  const onContinueOsUpdate = useCallback(() => {
    triggerBatteryCheck();
    setShowReleaseNotes(false);
  }, [triggerBatteryCheck]);

  const onRetryBatteryCheck = useCallback(() => {
    setShowBatteryWarningDrawer(false);
    triggerBatteryCheck();
  }, [triggerBatteryCheck]);

  return (
    <>
      {showReleaseNotes ? (
        <UpdateReleaseNotes
          onContinue={onContinueOsUpdate}
          firmwareNotes={firmwareUpdateContext.osu?.notes}
        />
      ) : fullUpdateComplete ? (
        <Flex flex={1} px={6} pb={7}>
          <TrackScreen category={"device OS successfully updated"} />
          <Flex flex={1} justifyContent="center">
            <GenericInformationBody
              Icon={Icons.CheckmarkCircleFill}
              iconColor="success.c50"
              title={t("FirmwareUpdate.updateDone", { deviceName: productName })}
              description={t("FirmwareUpdate.updateDoneDescription", {
                firmwareVersion: firmwareUpdateContext.final.name,
              })}
            />
          </Flex>
          <Flex>
            <Button size="large" type="main" outline={false} onPress={quitUpdate}>
              {t("FirmwareUpdate.finishUpdateCTA")}
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex flex={1} justifyContent="space-between">
          <Flex mb={6}>
            <Text variant="h4" fontWeight="semiBold" mx={6} my={3}>
              {t("FirmwareUpdate.updateDevice", { deviceName: productName })}
            </Text>
            <VerticalStepper steps={steps} />
          </Flex>
          <Flex mx={6} mb={8}>
            <Alert type="info" title={t("FirmwareUpdate.doNotLeaveLedgerLive")} />
          </Flex>
        </Flex>
      )}

      <BatteryWarningDrawer
        device={device}
        state={batteryStatusesState}
        lowBatteryPercentage={lowBatteryPercentage}
        isRequestingToBeOpened={showBatteryWarningDrawer}
        onQuit={quitUpdate}
        onRetry={onRetryBatteryCheck}
      />
      <QueuedDrawer isRequestingToBeOpened={Boolean(deviceInteractionDisplay)} noCloseButton>
        <Flex mt={7}>
          <ImageSourceContext.Provider value={staxImageSourceProviderValue}>
            {deviceInteractionDisplay}
          </ImageSourceContext.Provider>
        </Flex>
      </QueuedDrawer>
      <QueuedDrawer isRequestingToBeOpened={isCloseWarningOpen} noCloseButton>
        <CloseWarning
          onPressContinue={() => setIsCloseWarningOpen(false)}
          onPressQuit={quitUpdate}
        />
      </QueuedDrawer>
      {updateStep === "languageRestore" ? (
        <TrackScreen key="a" category={"Update device - Step 3a: restore language"} />
      ) : updateStep === "imageRestore" ? (
        <TrackScreen key="b" category={"Update device - Step 3b: restore lock screen picture"} />
      ) : updateStep === "appsRestore" ? (
        <TrackScreen key="c" category={"Update device - Step 3b: reinstall apps"} />
      ) : updateStep === "completed" ? (
        <TrackScreen
          key="d"
          category={"Update device - Step 3d: apps and settings successfully restored"}
        />
      ) : null}
      {staxFetchImageState.hexImage ? (
        <ImageHexProcessor
          hexData={staxFetchImageState.hexImage as string}
          {...targetDataDimensions}
          onPreviewResult={handleStaxImageSourceLoaded}
          onError={error => console.error(error)}
        />
      ) : null}
    </>
  );
};

const FirmwareUpdateScreen = () => {
  const { params } = useRoute<NavigationProps["route"]>();

  if (!params.device || !params.firmwareUpdateContext || !params.deviceInfo) return null;

  return (
    <Flex flex={1}>
      <FirmwareUpdate
        deviceInfo={params.deviceInfo}
        device={params.device}
        firmwareUpdateContext={params.firmwareUpdateContext}
        onBackFromUpdate={params.onBackFromUpdate}
        isBeforeOnboarding={params.isBeforeOnboarding}
      />
    </Flex>
  );
};

export default FirmwareUpdateScreen;
