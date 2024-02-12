import React, { useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import Config from "react-native-config";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import LText from "~/components/LText";
import Animation from "~/components/Animation";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import QueuedDrawer from "~/components/QueuedDrawer";
import Touchable from "~/components/Touchable";
import Check from "~/icons/Check";
import { lottieAnimations } from "../../../Onboarding/shared/infoPagesData";

const edges: Edge[] = ["bottom"];

const keys = [
  "plugAndPinCode",
  "enterPinCode",
  "quitApp",
  "allowManager",
  "openApp",
  "verify",
  "sign",
];
const onBoardingKeys = [
  "pinCode",
  "recover",
  "confirmWords",
  "numberOfWords",
  "powerOn",
  "powerOnRecovery",
];

function getAnimation(params: {
  key: string;
  wired: boolean;
  modelId: DeviceModelId;
  theme: "light" | "dark";
}) {
  const { key, wired, modelId, theme } = params;
  if (keys.includes(key)) {
    // Normal deviceAction animations
    return getDeviceAnimation({
      device: {
        deviceId: "",
        modelId,
        wired: wired && ["nanoX", "stax"].includes(modelId),
      },
      key,
      theme,
    });
  }

  if (onBoardingKeys.includes(key)) {
    // @ts-expect-error let's assume this is correct…
    return lottieAnimations[modelId][key][theme];
  }

  return null; // Onboarding animations
}

const DebugLottie = () => {
  const { colors } = useTheme();

  const [selectedModelId, setModelId] = useState<DeviceModelId>(
    (Config.OVERRIDE_MODEL_ID as DeviceModelId) || ("nanoS" as DeviceModelId),
  );
  const [wired, setWired] = useState(false);
  const [key, setKey] = useState<string>("plugAndPinCode");
  const [keyModalVisible, setKeyModalVisible] = useState(false);

  const animationLight = getAnimation({
    key,
    theme: "light",
    modelId: selectedModelId,
    wired,
  });
  const animationDark = getAnimation({
    key,
    theme: "dark",
    modelId: selectedModelId,
    wired,
  });

  const allKeys = [...keys, ...onBoardingKeys];
  const keyIndex = allKeys.findIndex(k => k === key);

  const animationNodeKey = `${key}_${selectedModelId}_${wired}`;

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
        {!key ? "Select Animation" : `Showing '${key}'`}
      </LText>
      <Flex flex={1}>
        <ScrollView>
          <View
            style={{
              borderWidth: 1,
            }}
          >
            {animationLight && <Animation key={animationNodeKey} source={animationLight} />}
          </View>
          <View
            style={{
              backgroundColor: "#121212",
            }}
          >
            {animationDark && <Animation key={animationNodeKey} source={animationDark} />}
          </View>
        </ScrollView>
      </Flex>
      <View style={styles.select}>
        {[
          DeviceModelId.nanoS,
          DeviceModelId.nanoSP,
          DeviceModelId.nanoX,
          DeviceModelId.stax,
          DeviceModelId.blue,
        ].map(modelId => (
          <Button
            key={modelId}
            type="primary"
            outline={selectedModelId === modelId}
            title={modelId}
            disabled={
              modelId === DeviceModelId.blue ||
              !!Config.OVERRIDE_MODEL_ID ||
              ([DeviceModelId.nanoS, DeviceModelId.nanoSP].includes(modelId) &&
                key === "pairDevice")
            }
            onPress={() => {
              setModelId(modelId as DeviceModelId);
            }}
          />
        ))}
      </View>
      <Button
        containerStyle={{
          marginTop: 8,
        }}
        type="primary"
        outline={false}
        title={`Show ${wired ? "Bluetooth" : "Wired"}`}
        disabled={!["nanoX", "stax"].includes(selectedModelId) || !keys.includes(key)}
        onPress={() => setWired(wired => !wired)}
      />
      <Flex mt={8} flexDirection="row">
        <Button
          disabled={keyIndex === 0}
          onPress={() => {
            setKey(allKeys[Math.max(keyIndex - 1, 0)]);
          }}
          type="primary"
          Icon={IconsLegacy.ChevronLeftMedium}
        />
        <Flex mx={3} flex={1}>
          <Button type="primary" title="Animation key" onPress={() => setKeyModalVisible(true)} />
        </Flex>
        <Button
          disabled={keyIndex === allKeys.length - 1}
          onPress={() => {
            setKey(allKeys[Math.min(keyIndex + 1, allKeys.length - 1)]);
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
          {allKeys.map((_key, i) => (
            <Touchable
              key={_key + i}
              onPress={() => {
                if (_key === "pairDevice") {
                  setModelId("nanoX" as DeviceModelId);
                  setWired(false);
                }

                setKey(_key);
                setKeyModalVisible(false);
              }}
              style={[styles.button]}
            >
              <LText
                {...(key === _key
                  ? {
                      semiBold: true,
                    }
                  : {})}
                style={[styles.buttonLabel]}
              >
                {_key}
              </LText>
              {key === _key && <Check size={16} color={colors.live} />}
            </Touchable>
          ))}
        </ScrollView>
      </QueuedDrawer>
    </SafeAreaView>
  );
};

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
export default DebugLottie;
