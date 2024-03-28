import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Text, Flex } from "@ledgerhq/native-ui";
import React from "react";
import { StyleSheet } from "react-native";
import staxAllowConnection from "~/animations/stax/customimage/allowConnection.json";
import staxConfirmLockscreen from "~/animations/stax/customimage/confirmLockscreen.json";
import { FramedImageWithContext } from "../CustomImage/FramedPicture";
import { getFramedPictureConfig } from "../CustomImage/framedPictureConfigs";
import {
  Props as FramedImageWithLottieProps,
  FramedLottieWithContext,
} from "../CustomImage/FramedLottie";
import { useTranslation } from "react-i18next";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { DeviceModelId } from "@ledgerhq/types-devices";

const ImageLoadingGeneric: React.FC<{
  title: string;
  fullScreen?: boolean;
  children?: React.ReactNode | undefined;
  progress?: number;
  lottieSource?: FramedImageWithLottieProps["lottieSource"];
  deviceModelId: CLSSupportedDeviceModelId;
}> = ({ title, fullScreen = true, children, progress, lottieSource, deviceModelId }) => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      alignSelf="stretch"
      flex={fullScreen ? 1 : undefined}
    >
      <Flex {...(fullScreen ? StyleSheet.absoluteFillObject : {})}>
        <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={8} alignSelf="stretch">
          {title}
        </Text>
      </Flex>
      <Flex flexDirection={"column"} alignItems="center" alignSelf="stretch">
        {lottieSource ? (
          <FramedLottieWithContext
            deviceModelId={deviceModelId}
            loadingProgress={progress}
            lottieSource={lottieSource}
          >
            {children}
          </FramedLottieWithContext>
        ) : (
          <FramedImageWithContext
            loadingProgress={progress}
            framedPictureConfig={getFramedPictureConfig("transfer", deviceModelId)}
          >
            {children}
          </FramedImageWithContext>
        )}
      </Flex>
    </Flex>
  );
};

export const RenderImageLoadRequested = ({
  device,
  deviceModelId,
  fullScreen = true,
  wording,
}: {
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  fullScreen?: boolean;
  wording?: string;
}) => {
  const { t } = useTranslation();
  return (
    <ImageLoadingGeneric
      fullScreen={fullScreen}
      title={
        wording ??
        t("customImage.allowPreview", {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        })
      }
      lottieSource={staxAllowConnection}
      progress={0}
      deviceModelId={deviceModelId}
    />
  );
};

export const RenderLoadingImage = ({
  device,
  deviceModelId,
  progress,
}: {
  progress: number;
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
}) => {
  const { t } = useTranslation();
  return (
    <ImageLoadingGeneric
      title={t(
        progress > 0.9 ? "customImage.loadingPictureAlmostOver" : "customImage.loadingPicture",
        {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        },
      )}
      progress={progress}
      deviceModelId={deviceModelId}
    />
  );
};

/** hardcoded values to not have the image overflowing the "confirm button" in the lottie */
const maxProgressWithConfirmButton: Record<CLSSupportedDeviceModelId, number> = {
  [DeviceModelId.stax]: 0.89,
  [DeviceModelId.europa]: 0.89, // TODO: TBD
};

export const RenderImageCommitRequested = ({
  device,
  deviceModelId,
  fullScreen = true,
  wording,
}: {
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  fullScreen?: boolean;
  wording?: string;
}) => {
  const { t } = useTranslation();
  return (
    <ImageLoadingGeneric
      fullScreen={fullScreen}
      title={
        wording ??
        t("customImage.commitRequested", {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        })
      }
      lottieSource={staxConfirmLockscreen}
      progress={maxProgressWithConfirmButton[deviceModelId]}
      deviceModelId={deviceModelId}
    />
  );
};
