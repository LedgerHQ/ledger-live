import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "../../DeviceAction/animations";
import { DeviceBlocker } from "../../DeviceAction/DeviceBlocker";
import { Theme, Flex, Text } from "@ledgerhq/react-ui";
import FramedPicture from "../FramedPicture";
import { AnimationWrapper } from "../../DeviceAction/rendering";
import { useTranslation } from "react-i18next";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

export const RenderImageLoadRequested = ({
  device,
  restore,
  type,
}: {
  device: Device;
  restore: boolean;
  type: Theme["theme"];
}) => {
  const { t } = useTranslation();
  return (
    <Flex
      flex={1}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      data-testid="device-action-image-load-requested"
    >
      <DeviceBlocker />
      <AnimationWrapper>
        <Animation animation={getDeviceAnimation(device.modelId, type, "allowManager")} />
      </AnimationWrapper>
      <Flex justifyContent="center" mt={2}>
        <Text variant="h4Inter" whiteSpace="pre-wrap" textAlign="center" pt="40px">
          {t(
            restore
              ? "customImage.steps.transfer.allowConfirmPreview"
              : "customImage.steps.transfer.allowPreview",
          )}
        </Text>
      </Flex>
    </Flex>
  );
};

export const RenderLoadingImage = ({
  device,
  progress,
  source,
  deviceModelId,
}: {
  deviceModelId: CLSSupportedDeviceModelId;
  device: Device;
  progress: number | undefined;
  source?: string;
}) => {
  const { t } = useTranslation();
  return (
    <Flex
      flex={1}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      data-testid={`device-action-image-loading-${progress}`}
    >
      <DeviceBlocker />
      <AnimationWrapper>
        <FramedPicture deviceModelId={deviceModelId} source={source} loadingProgress={progress} />
      </AnimationWrapper>
      <Text variant="h4Inter" whiteSpace="pre-wrap" textAlign="center" pt="40px">
        {`${t(
          progress && progress > 0.9
            ? "customImage.steps.transfer.voila"
            : "customImage.steps.transfer.loadingPicture",
          {
            productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
          },
        )}\n `}
      </Text>
    </Flex>
  );
};

export const RenderImageCommitRequested = ({
  device,
  source,
  restore,
  deviceModelId,
}: {
  deviceModelId: CLSSupportedDeviceModelId;
  device: Device;
  restore: boolean;
  source?: string;
}) => {
  const { t } = useTranslation();
  return (
    <Flex
      flex={1}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      data-testid="device-action-image-commit-requested"
    >
      <DeviceBlocker />
      <AnimationWrapper>
        <FramedPicture deviceModelId={deviceModelId} source={source} showConfirmationButton />
      </AnimationWrapper>
      <Text variant="h4Inter" whiteSpace="pre-wrap" textAlign="center" pt="40px">
        {t(
          restore
            ? "customImage.steps.transfer.confirmRestorePicture"
            : "customImage.steps.transfer.confirmPicture",
          {
            productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
          },
        )}
      </Text>
    </Flex>
  );
};
