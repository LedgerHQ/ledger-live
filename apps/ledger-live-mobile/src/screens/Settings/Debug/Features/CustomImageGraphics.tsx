import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Divider, Flex, Switch, Text } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import NavigationScrollView from "~/components/NavigationScrollView";
import { FramedImageWithContext, ImageSourceContext } from "~/components/CustomImage/FramedPicture";
import {
  RenderImageCommitRequested,
  RenderImageLoadRequested,
  RenderLoadingImage,
} from "~/components/CustomLockScreenDeviceAction/stepsRendering";
import imageSource from "~/components/CustomImage/assets/examplePicture2.webp";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getFramedPictureConfig } from "~/components/CustomImage/framedPictureConfigs";
import { useTheme } from "styled-components/native";

const aStaxDevice: Device = {
  deviceId: "",
  deviceName: "",
  modelId: DeviceModelId.stax,
  wired: false,
};

const aEuropaDevice: Device = {
  deviceId: "",
  deviceName: "",
  modelId: DeviceModelId.europa,
  wired: false,
};

const steps = ["confirmLoad", "loading", "confirmCommit", "preview"] as const;
type DeviceActionStep = (typeof steps)[number];

export default function DebugCustomImageGraphics() {
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [deviceActionStep, setDeviceActionStep] = useState<DeviceActionStep>("confirmLoad");
  const [progress, setProgress] = useState(0);
  const { colors } = useTheme();
  const theme = colors.type as "light" | "dark";

  const [deviceModelId, setDeviceModelId] = useState<CLSSupportedDeviceModelId>(DeviceModelId.stax);
  const device = {
    stax: aStaxDevice,
    europa: aEuropaDevice,
  }[deviceModelId];

  const insets = useSafeAreaInsets();

  const slider = (
    <Slider
      value={progress}
      minimumValue={0}
      maximumValue={1}
      step={0.01}
      onValueChange={val => typeof val === "number" && setProgress(val)}
    />
  );

  const framedPreviewConfig = getFramedPictureConfig("preview", deviceModelId, theme);
  const framedTransferConfig = getFramedPictureConfig("transfer", deviceModelId, theme);

  return (
    <ImageSourceContext.Provider value={{ source: imageSource }}>
      {showAllAssets ? (
        <NavigationScrollView>
          <Flex style={styles.root}>
            <Divider />
            <Text>FramedImage component, transferConfig</Text>
            <Text mb={3}>progress={Math.round(progress * 100) / 100}</Text>
            <FramedImageWithContext
              framedPictureConfig={framedTransferConfig}
              style={{ backgroundColor: "red" }}
              loadingProgress={progress}
            />

            {slider}
            <Divider />
            <Text mb={3}>FramedImage component, previewConfig</Text>
            <FramedImageWithContext framedPictureConfig={framedPreviewConfig} />
          </Flex>
        </NavigationScrollView>
      ) : (
        <Flex flex={1} alignItems="center" justifyContent="center">
          {deviceActionStep === "confirmLoad" ? (
            <RenderImageLoadRequested device={device} deviceModelId={deviceModelId} />
          ) : deviceActionStep === "loading" ? (
            <RenderLoadingImage device={device} progress={progress} deviceModelId={deviceModelId} />
          ) : deviceActionStep === "confirmCommit" ? (
            <RenderImageCommitRequested device={device} deviceModelId={deviceModelId} />
          ) : deviceActionStep === "preview" ? (
            <FramedImageWithContext
              framedPictureConfig={getFramedPictureConfig("preview", deviceModelId, theme)}
            />
          ) : null}
        </Flex>
      )}
      <Flex style={{ paddingBottom: insets.bottom }} borderTopWidth={1} borderColor="neutral.c100">
        <Flex p={4}>
          <Switch checked={showAllAssets} label="Show all assets" onChange={setShowAllAssets} />
          <Divider />
          <Flex
            mt={2}
            opacity={showAllAssets ? 0.3 : 1}
            pointerEvents={showAllAssets ? "none" : "auto"}
          >
            <Flex flexDirection={"row"} flexGrow={1} flexWrap={"wrap"} style={{ rowGap: 3 }}>
              {steps.map(val => (
                <Button
                  key={val}
                  type="main"
                  size="small"
                  onPress={() => setDeviceActionStep(val)}
                  mr={3}
                >
                  {val}
                </Button>
              ))}
            </Flex>
            <Flex flexDirection={"row"} flexGrow={1} flexWrap={"wrap"} style={{ rowGap: 3 }}>
              {supportedDeviceModelIds.map(val => (
                <Button
                  key={val}
                  type="main"
                  size="small"
                  onPress={() => setDeviceModelId(val)}
                  mr={3}
                >
                  {val}
                </Button>
              ))}
            </Flex>
            <Flex
              mt={2}
              flexDirection="row"
              alignItems="center"
              opacity={deviceActionStep !== "loading" ? 0.3 : 1}
              pointerEvents={deviceActionStep !== "loading" ? "none" : "auto"}
            >
              <Text>loading progress: </Text>
              <Flex flex={1}>{slider}</Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </ImageSourceContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});
