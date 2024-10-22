import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Text, Flex } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { FramedImageWithContext } from "../CustomImage/FramedPicture";
import { getFramedPictureConfig } from "../CustomImage/framedPictureConfigs";
import {
  Props as FramedImageWithLottieProps,
  FramedLottieWithContext,
} from "../CustomImage/FramedLottie";
import { useTranslation } from "react-i18next";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useTheme } from "styled-components/native";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import AnimatedLottieView from "lottie-react-native";

const ImageLoadingGeneric: React.FC<{
  title: string;
  fullScreen?: boolean;
  children?: React.ReactNode | undefined;
  progress?: number;
  lottieSource?: FramedImageWithLottieProps["lottieSource"];
  deviceModelId: CLSSupportedDeviceModelId;
}> = ({ title, fullScreen = true, children, progress, lottieSource, deviceModelId }) => {
  const { colors } = useTheme();
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
            framedPictureConfig={getFramedPictureConfig(
              "transfer",
              deviceModelId,
              colors.type as "light" | "dark",
            )}
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
  const { colors } = useTheme();
  const theme = colors.type as "dark" | "light";
  const framedPictureConfig = useMemo(
    () => getFramedPictureConfig("transfer", deviceModelId, colors.type as "light" | "dark"),
    [deviceModelId, colors.type],
  );
  const lottieStyle = useMemo(
    () => ({
      width: framedPictureConfig.frameWidth / 3,
      height: framedPictureConfig.frameHeight / 3,
    }),
    [framedPictureConfig],
  );
  const lottieSource = useMemo(
    () => getDeviceAnimation({ theme, key: "allowCustomLockScreen", modelId: deviceModelId }),
    [theme, deviceModelId],
  );
  const title = useMemo(
    () =>
      wording ??
      t("customImage.allowPreview", {
        productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
      }),
    [device.deviceName, device.modelId, t, wording],
  );
  if (deviceModelId === DeviceModelId.europa) {
    return (
      <>
        <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={8} alignSelf="stretch">
          {title}
        </Text>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" flex={1}>
          <AnimatedLottieView autoPlay loop style={lottieStyle} source={lottieSource} />
        </Flex>
      </>
    );
  }
  return (
    <ImageLoadingGeneric
      fullScreen={fullScreen}
      title={title}
      lottieSource={lottieSource}
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
  [DeviceModelId.europa]: 0.85, // TODO: TBD
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
  const { colors } = useTheme();
  const theme = colors.type as "dark" | "light";
  return (
    <ImageLoadingGeneric
      fullScreen={fullScreen}
      title={
        wording ??
        t("customImage.commitRequested", {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        })
      }
      lottieSource={
        deviceModelId === DeviceModelId.stax
          ? getDeviceAnimation({ theme, key: "confirmCustomLockScreen", modelId: deviceModelId })
          : undefined
      }
      progress={maxProgressWithConfirmButton[deviceModelId]}
      deviceModelId={deviceModelId}
    >
      <Flex
        flex={1}
        style={{
          position: "absolute",
          bottom: -48,
          left: 58,
          width: 448,
          height: 75,
        }}
      >
        <Flex flexDirection="row" flex={2}>
          <Flex
            flexDirection="column"
            flex={1}
            alignItems="center"
            justifyContent="center"
            backgroundColor={colors.palette.constant.white}
          >
            <Text
              textAlign="center"
              variant="h4"
              fontWeight="semiBold"
              color={colors.palette.constant.black}
            >
              {t("customImage.discardOnDevice")}
            </Text>
          </Flex>
          <Flex
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            flex={1}
            backgroundColor={colors.palette.constant.black}
          >
            <Text
              textAlign="center"
              variant="h4"
              fontWeight="semiBold"
              color={colors.palette.constant.white}
            >
              {t("customImage.keepOnDevice")}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </ImageLoadingGeneric>
  );
};
