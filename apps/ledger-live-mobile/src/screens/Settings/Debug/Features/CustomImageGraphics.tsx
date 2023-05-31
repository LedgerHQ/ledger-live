import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
  Button,
  Divider,
  Flex,
  InfiniteLoader,
  Switch,
  Text,
} from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "react-native-slider";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import {
  transferConfig,
  previewConfig,
  FramedImageWithContext,
  ImageSourceContext,
} from "../../../../components/CustomImage/FramedImage";
import confirmLockscreen from "../../../../animations/stax/customimage/confirmLockscreen.json";
import allowConnection from "../../../../animations/stax/customimage/allowConnection.json";
import { FramedImageWithLottieWithContext } from "../../../../components/CustomImage/FramedImageWithLottie";
import {
  renderImageCommitRequested,
  renderImageLoadRequested,
  renderLoadingImage,
} from "../../../../components/DeviceAction/rendering";
import imageSource from "../../../../components/CustomImage/assets/examplePicture2.webp";

const device = {
  deviceId: "",
  deviceName: "",
  modelId: DeviceModelId.stax,
  wired: false,
};

export default function DebugCustomImageGraphics() {
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [deviceActionStep, setDeviceActionStep] = useState("confirmLoad");
  const [progress, setProgress] = useState(0);

  const { t } = useTranslation();

  const insets = useSafeAreaInsets();

  const loader = (
    <Flex flex={1} justifyContent="center" alignItems="center">
      <InfiniteLoader />
    </Flex>
  );

  const slider = (
    <Slider
      value={progress}
      minimumValue={0}
      maximumValue={1}
      step={0.01}
      onValueChange={val => typeof val === "number" && setProgress(val)}
    />
  );

  return (
    <ImageSourceContext.Provider value={{ source: imageSource }}>
      {showAllAssets ? (
        <NavigationScrollView>
          <Flex style={styles.root}>
            <Text mb={3}>lottie: allowConnection</Text>
            <FramedImageWithLottieWithContext
              loadingProgress={0}
              lottieSource={allowConnection}
            />
            <Divider />
            <Text mb={3}>lottie: confirmLockscreen</Text>
            <FramedImageWithLottieWithContext
              loadingProgress={0.89}
              lottieSource={confirmLockscreen}
            />
            <Divider />
            <Text>FramedImage component, transferConfig</Text>
            <Text mb={3}>progress={Math.round(progress * 100) / 100}</Text>
            <FramedImageWithContext
              frameConfig={transferConfig}
              style={{ backgroundColor: "red" }}
              loadingProgress={progress}
            />

            {slider}
            <Divider />
            <Text mb={3}>FramedImage component, previewConfig</Text>
            <FramedImageWithContext frameConfig={previewConfig} />
          </Flex>
        </NavigationScrollView>
      ) : (
        <Flex flex={1}>
          {deviceActionStep === "confirmLoad"
            ? renderImageLoadRequested({ t, device })
            : deviceActionStep === "loading"
            ? renderLoadingImage({ t, device, progress })
            : renderImageCommitRequested({ t, device })}
        </Flex>
      )}
      <Flex
        style={{ paddingBottom: insets.bottom }}
        borderTopWidth={1}
        borderColor="neutral.c100"
      >
        <Flex p={4}>
          <Switch
            checked={showAllAssets}
            label="Show all assets"
            onChange={setShowAllAssets}
          />
          <Divider />
          <Flex
            mt={2}
            opacity={showAllAssets ? 0.3 : 1}
            pointerEvents={showAllAssets ? "none" : "auto"}
          >
            <Flex flexDirection={"row"}>
              {["confirmLoad", "loading", "confirmCommit"].map(val => (
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
