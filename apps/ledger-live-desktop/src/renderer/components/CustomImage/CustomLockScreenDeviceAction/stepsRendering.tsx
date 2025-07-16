import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "../../DeviceAction/animations";
import { DeviceBlocker } from "../../DeviceAction/DeviceBlocker";
import { Theme, Flex } from "@ledgerhq/react-ui";
import FramedPicture from "../FramedPicture";
import { AnimationWrapper, Title } from "../../DeviceAction/rendering";
import { useTranslation } from "react-i18next";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { getFramedPictureConfig } from "../framedPictureConfigs";

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
        <Title>
          {t(
            restore
              ? "customImage.steps.transfer.allowConfirmPreview"
              : "customImage.steps.transfer.allowPreview",
          )}
        </Title>
      </Flex>
    </Flex>
  );
};

export const RenderLoadingImage = ({
  device,
  progress,
  source,
  deviceModelId,
  type,
}: {
  deviceModelId: CLSSupportedDeviceModelId;
  device: Device;
  progress: number | undefined;
  source?: string;
  type: Theme["theme"];
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
        <FramedPicture
          frameConfig={getFramedPictureConfig("transfer", deviceModelId, type)}
          source={source}
          loadingProgress={progress}
        />
      </AnimationWrapper>
      <Flex justifyContent="center" mt={2}>
        <Title>
          {t(
            progress && progress > 0.9
              ? "customImage.steps.transfer.voila"
              : "customImage.steps.transfer.loadingPicture",
            {
              productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
            },
          )}
        </Title>
      </Flex>
    </Flex>
  );
};

export const RenderImageCommitRequested = ({
  device,
  source,
  restore,
  type,
  deviceModelId,
}: {
  deviceModelId: CLSSupportedDeviceModelId;
  device: Device;
  restore: boolean;
  type: Theme["theme"];
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
        <FramedPicture
          frameConfig={getFramedPictureConfig("preview", deviceModelId, type)}
          source={source}
          background={
            <Animation animation={getDeviceAnimation(device.modelId, type, "confirmLockscreen")} />
          }
        />
      </AnimationWrapper>
      <Flex justifyContent="center" mt={2}>
        <Title mb={!restore ? "-24px" : undefined}>
          {t(
            restore
              ? "customImage.steps.transfer.confirmRestorePicture"
              : "customImage.steps.transfer.confirmPicture",
            {
              productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
            },
          )}
        </Title>
      </Flex>
    </Flex>
  );
};
