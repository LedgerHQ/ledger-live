import React, { useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import LText from "~/components/LText";
import Animation from "~/components/Animation";
import { getAnimationKeysForDeviceModelId, getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import QueuedDrawer from "~/components/QueuedDrawer";
import Touchable from "~/components/Touchable";
import Check from "~/icons/Check";
import {
  getOnboardingDeviceAnimation,
  getAnimationKeysForDeviceModelId as getOnboardingAnimationKeysForDeviceModelId,
} from "../../../Onboarding/shared/infoPagesData";

const edges: Edge[] = ["bottom"];

function usePrevious<T>(val: T): T {
  const ref = React.useRef<T>(val);
  const prevVal = ref.current;
  ref.current = val;
  return prevVal;
}

type EnabledDeviceModelIds =
  | DeviceModelId.nanoS
  | DeviceModelId.nanoSP
  | DeviceModelId.nanoX
  | DeviceModelId.stax
  | DeviceModelId.europa;

const deviceModelIds: Array<EnabledDeviceModelIds> = [
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
  DeviceModelId.stax,
  DeviceModelId.europa,
];

function getAllAnimations(selectedModelId: DeviceModelId) {
  const keysForDeviceModelId = getAnimationKeysForDeviceModelId(selectedModelId);
  const onboardingKeysForDeviceModelId =
    getOnboardingAnimationKeysForDeviceModelId(selectedModelId);
  return [
    ...keysForDeviceModelId.map(key => ({
      key,
      light: getDeviceAnimation({ modelId: selectedModelId, key, theme: "light" }),
      dark: getDeviceAnimation({ modelId: selectedModelId, key, theme: "dark" }),
    })),
    ...onboardingKeysForDeviceModelId.map(key => ({
      key,
      light: getOnboardingDeviceAnimation({ modelId: selectedModelId, key, theme: "light" }),
      dark: getOnboardingDeviceAnimation({ modelId: selectedModelId, key, theme: "dark" }),
    })),
  ];
}

export default function DebugLottie() {
  const { colors } = useTheme();

  const [selectedModelId, setModelId] = useState<EnabledDeviceModelIds>(DeviceModelId.nanoS);
  const [animations, setAnimations] = useState(getAllAnimations(selectedModelId));
  const [selectedAnimationIndex, setSelectedAnimationIndex] = useState(0);
  const [keyModalVisible, setKeyModalVisible] = useState(false);

  const allKeys = animations.map(({ key }) => key);
  const selectedKey = allKeys[selectedAnimationIndex];

  const previousSelectedModelId = usePrevious(selectedModelId);
  if (previousSelectedModelId !== selectedModelId) {
    const newAnimations = getAllAnimations(selectedModelId);
    setAnimations(newAnimations);
    const newAnimationIndex = newAnimations.findIndex(({ key }) => key === selectedKey, 0);
    setSelectedAnimationIndex(newAnimationIndex === -1 ? 0 : newAnimationIndex);
  }

  const animationLight = animations[selectedAnimationIndex]?.light;
  const animationDark = animations[selectedAnimationIndex]?.dark;

  const animationNodeKey = `${selectedAnimationIndex}_${selectedModelId}`;

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <LText secondary semiBold style={styles.title}>
        {!selectedKey ? "Select Animation" : `Showing '${selectedKey}'`}
      </LText>
      <Flex flex={1}>
        <ScrollView style={{ backgroundColor: "grey" }}>
          <Flex>
            {animationLight && (
              <Animation
                key={animationNodeKey}
                source={animationLight}
                style={{
                  backgroundColor: "white",
                }}
              />
            )}
          </Flex>
          <Flex p={2}>
            {animationDark && (
              <Animation
                key={animationNodeKey}
                source={animationDark}
                style={{
                  backgroundColor: "#121212",
                }}
              />
            )}
          </Flex>
        </ScrollView>
      </Flex>
      <View style={styles.select}>
        {deviceModelIds.map(modelId => (
          <Button
            key={modelId}
            type="primary"
            outline={selectedModelId === modelId}
            title={modelId}
            onPress={() => {
              setModelId(modelId);
            }}
          />
        ))}
      </View>
      <Flex mt={8} flexDirection="row">
        <Button
          disabled={selectedAnimationIndex === 0}
          onPress={() => {
            setSelectedAnimationIndex(Math.max(selectedAnimationIndex - 1, 0));
          }}
          type="primary"
          Icon={IconsLegacy.ChevronLeftMedium}
        />
        <Flex mx={3} flex={1}>
          <Button type="primary" title="Animation key" onPress={() => setKeyModalVisible(true)} />
        </Flex>
        <Button
          disabled={selectedAnimationIndex === allKeys.length - 1}
          onPress={() => {
            setSelectedAnimationIndex(Math.min(selectedAnimationIndex + 1, allKeys.length - 1));
          }}
          type="primary"
          Icon={IconsLegacy.ChevronRightMedium}
        />
      </Flex>
      <QueuedDrawer
        isRequestingToBeOpened={keyModalVisible}
        onClose={setKeyModalVisible as () => void}
      >
        <ScrollView style={styles.modal}>
          {animations.map(({ key }, i) => (
            <Touchable
              key={key + i}
              onPress={() => {
                setSelectedAnimationIndex(i);
                setKeyModalVisible(false);
              }}
              style={[styles.button]}
            >
              <LText
                {...(i === selectedAnimationIndex
                  ? {
                      semiBold: true,
                    }
                  : {})}
                style={[styles.buttonLabel]}
              >
                {key}
              </LText>
              {i === selectedAnimationIndex && <Check size={16} color={colors.live} />}
            </Touchable>
          ))}
        </ScrollView>
      </QueuedDrawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 8,
  },
  anim: {
    flex: 1,
  },
  title: {
    margin: 16,
    textAlign: "center",
  },
  select: {
    marginTop: 20,
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
    rowGap: 5,
  },
  button: {
    height: 50,
    margin: 8,
    borderRadius: 4,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
    flexDirection: "row",
  },
  buttonLabel: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  modal: {
    padding: 8,
  },
});
