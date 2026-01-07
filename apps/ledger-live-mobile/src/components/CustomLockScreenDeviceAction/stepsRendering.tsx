import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Text, Flex, Icons } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { FramedImageWithContext } from "../CustomImage/FramedPicture";
import { getFramedPictureConfig } from "../CustomImage/framedPictureConfigs";
import { useTranslation } from "react-i18next";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { useTheme } from "styled-components/native";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import Animation from "~/components/Animation";

const ImageLoadingGeneric: React.FC<{
  title: string;
  fullscreen?: boolean;
  children?: React.ReactNode | undefined;
  progress?: number;
  isLottieAnimation?: boolean;
  deviceModelId: CLSSupportedDeviceModelId;
}> = ({ title, fullscreen, children, progress, deviceModelId, isLottieAnimation = false }) => {
  const { colors } = useTheme();

  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      alignSelf="stretch"
      flex={fullscreen ? 1 : undefined}
    >
      <Flex flexDirection={"column"} alignItems="center" alignSelf="stretch">
        {isLottieAnimation ? (
          <Flex height={200} width={200} mb={32}>
            <Animation
              style={{ width: "100%" }}
              source={getDeviceAnimation({
                modelId: deviceModelId,
                key: "allowManager",
                theme: colors.type as "light" | "dark",
              })}
            />
          </Flex>
        ) : (
          <FramedImageWithContext loadingProgress={progress} deviceModelId={deviceModelId}>
            {children}
          </FramedImageWithContext>
        )}
      </Flex>
      <Flex>
        <Text textAlign="center" variant="h4" fontWeight="semiBold" mt={8}>
          {title}
        </Text>
      </Flex>
    </Flex>
  );
};

export const RenderImageLoadRequested = ({
  device,
  deviceModelId,
  fullscreen,
  wording,
}: {
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  fullscreen?: boolean;
  wording?: string;
}) => {
  const { t } = useTranslation();
  const title = useMemo(
    () =>
      wording ??
      t("customImage.allowPreview", {
        productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
      }),
    [device.deviceName, device.modelId, t, wording],
  );

  return (
    <ImageLoadingGeneric
      fullscreen={fullscreen}
      title={title}
      deviceModelId={deviceModelId}
      isLottieAnimation
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
      /**
       * This component is not being used when updating firmware, so it will always be in fullscreen
       * mode when used in the Custom Lock Screen flow
       */
      fullscreen
    />
  );
};

export const RenderImageCommitRequested = ({
  device,
  deviceModelId,
  fullscreen,
  wording,
}: {
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  fullscreen?: boolean;
  wording?: string;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const framedPictureConfig = getFramedPictureConfig(deviceModelId);

  return (
    <ImageLoadingGeneric
      fullscreen={fullscreen}
      title={
        wording ??
        t("customImage.commitRequested", {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        })
      }
      progress={1}
      deviceModelId={deviceModelId}
    >
      <Flex
        flex={1}
        style={{
          position: "absolute",
          top: framedPictureConfig.innerTop + framedPictureConfig.innerHeight - 50,
          height: 50,
          left:
            framedPictureConfig.frameWidth -
            framedPictureConfig.innerRight -
            framedPictureConfig.innerWidth,
          width: framedPictureConfig.innerWidth,
          borderBottomRightRadius: framedPictureConfig.borderRightRadius,
          borderBottomLeftRadius: framedPictureConfig.borderLeftRadius,
          overflow: "hidden",
        }}
        bg={colors.neutral.c90}
      >
        <Flex width={"50%"} height={"100%"} ml="auto" backgroundColor={colors.neutral.c30}>
          <Icons.Check color={colors.neutral.c100} style={{ margin: "auto" }} />
        </Flex>
      </Flex>
    </ImageLoadingGeneric>
  );
};
