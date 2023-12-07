import { StorylyInstanceID } from "@ledgerhq/types-live";
<<<<<<< HEAD
import { useFeatureFlags } from "@ledgerhq/live-config/featureFlags/index";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
=======
import { useFeatureFlags } from "@ledgerhq/live-config/FeatureFlags/index";
import useFeature from "@ledgerhq/live-config/FeatureFlags/useFeature";
>>>>>>> f8e0133b13 (fix: refactoring)
import React, { useCallback, useState } from "react";
import { Camera } from "expo-camera";
import { Flex, Switch, BaseInput, Text, IconsLegacy } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import { InputRenderRightContainer } from "@ledgerhq/native-ui/components/Form/Input/BaseInput/index";
import { BarCodeScanningResult, CameraType } from "expo-camera/build/Camera.types";
import QueuedDrawer from "../QueuedDrawer";

type Props = {
  instanceID: StorylyInstanceID;
};

/**
 * UI that allows fine modification of the storyly feature flag configuration
 * for a given story.
 * */
const StoriesConfig: React.FC<Props> = ({ instanceID }) => {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [permission, requestPermission] = Camera.useCameraPermissions();

  const { overrideFeature } = useFeatureFlags();
  const featureValue = useFeature("storyly");
  const stories = featureValue?.params?.stories;
  // @ts-expect-error TYPINGS
  const storyConfig = stories[instanceID];
  const { testingEnabled, token } = storyConfig;

  const overrideStoryConfig = useCallback(
    (val: { testingEnabled: boolean; token: string }) => {
      overrideFeature("storyly", {
        ...featureValue,
        enabled: true,
        params: {
          ...(featureValue || {}).params,
          stories: {
            ...stories,
            [instanceID]: val,
          },
        },
      });
    },
    [featureValue, instanceID, overrideFeature, stories],
  );

  const handleSwitchChange = useCallback(
    (val: boolean) => {
      overrideStoryConfig({ ...storyConfig, testingEnabled: val });
    },
    [overrideStoryConfig, storyConfig],
  );

  const handleTokenChange = useCallback(
    (input: string) => {
      overrideStoryConfig({ ...storyConfig, token: input });
    },
    [overrideStoryConfig, storyConfig],
  );

  const handleBarCodeScanned = useCallback(
    ({ data }: BarCodeScanningResult) => {
      try {
        const parsedData = JSON.parse(data);
        const { token } = parsedData;
        handleTokenChange(token);
        setShowCameraModal(false);
      } catch (e) {
        console.error(e);
      }
    },
    [handleTokenChange],
  );

  const openCameraModal = useCallback(() => {
    if (!permission?.granted) requestPermission().then(() => setShowCameraModal(true));
    else setShowCameraModal(true);
  }, [permission, requestPermission]);

  return (
    <Flex backgroundColor="neutral.c40">
      <Flex mb={3}>
        <Text variant="h5">Story remote config</Text>
        <Text mb={3}>Applies to the entire app</Text>
        <Switch
          label="Display testing groups"
          checked={testingEnabled}
          onChange={handleSwitchChange}
        />
      </Flex>
      <BaseInput
        onChange={handleTokenChange}
        renderLeft={
          <Text color={"neutral.c100"} ml={4} alignSelf="center">
            token:
          </Text>
        }
        renderRight={
          <InputRenderRightContainer>
            <TouchableOpacity onPress={openCameraModal}>
              <IconsLegacy.QrCodeMedium size={24} color={"neutral.c100"} />
            </TouchableOpacity>
          </InputRenderRightContainer>
        }
        value={token}
      />
      <QueuedDrawer
        isRequestingToBeOpened={showCameraModal}
        onClose={() => setShowCameraModal(false)}
      >
        <Flex>
          <Text variant="h4">Story QR code scanning</Text>
          <Text mb={5}>
            Go to dashboard.storyly.io/settings/apps and open any instance QR code then you can scan
            it here
          </Text>
          <Camera
            type={CameraType.back}
            style={{ height: 250, width: 250, alignSelf: "center" }}
            onBarCodeScanned={handleBarCodeScanned}
          />
        </Flex>
      </QueuedDrawer>
    </Flex>
  );
};

export default StoriesConfig;
