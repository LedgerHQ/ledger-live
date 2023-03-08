import React, { useMemo, useState } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import Config from "react-native-config";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flex, Icons } from "@ledgerhq/native-ui";
import Button from "../../../../components/Button";
import LText from "../../../../components/LText";
import Animation from "../../../../components/Animation";
import { getDeviceAnimation } from "../../../../helpers/getDeviceAnimation";
import QueuedDrawer from "../../../../components/QueuedDrawer";
import Touchable from "../../../../components/Touchable";
import Check from "../../../../icons/Check";
import { lottieAnimations } from "../../../Onboarding/shared/infoPagesData";

const edges: Edge[] = ["bottom"];

const DebugLottie = () => {
  const { colors } = useTheme();
  const keys = useMemo(
    () => [
      "plugAndPinCode",
      "enterPinCode",
      "quitApp",
      "allowManager",
      "openApp",
      "verify",
      "sign",
    ],
    [],
  );
  const onBoardingKeys = useMemo(
    () => [
      "pinCode",
      "recover",
      "confirmWords",
      "numberOfWords",
      "powerOn",
      "powerOnRecovery",
    ],
    [],
  );
  const [modelId, setModelId] = useState<DeviceModelId>(
    (Config.OVERRIDE_MODEL_ID as DeviceModelId) || ("nanoS" as DeviceModelId),
  );
  const [wired, setWired] = useState(false);
  const [key, setKey] = useState<string>("plugAndPinCode");
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const animation = useMemo(() => {
    if (keys.includes(key)) {
      // Normal deviceAction animations
      return getDeviceAnimation({
        device: {
          deviceId: "",
          modelId,
          wired: wired && modelId === "nanoX",
        },
        key,
        theme: "light",
      });
    }

    if (onBoardingKeys.includes(key)) {
      // @ts-expect-error let's assume this is correct…
      return lottieAnimations[modelId][key].light;
    }

    return null; // Onboarding animations
  }, [key, keys, modelId, onBoardingKeys, wired]);
  const animation2 = useMemo(() => {
    if (keys.includes(key)) {
      // Normal deviceAction animations
      return getDeviceAnimation({
        device: {
          deviceId: "",
          modelId,
          wired: wired && modelId === "nanoX",
        },
        key,
        theme: "dark",
      });
    }

    if (onBoardingKeys.includes(key)) {
      // @ts-expect-error let's assume this is correct…
      return lottieAnimations[modelId][key].dark;
    }

    return null; // Onboarding animations
  }, [key, keys, modelId, onBoardingKeys, wired]);
  const allKeys = [...keys, ...onBoardingKeys];
  const keyIndex = allKeys.findIndex(k => k === key);
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
      <ScrollView>
        <View
          style={{
            borderWidth: 1,
          }}
        >
          {animation && <Animation source={animation} />}
        </View>
        <View
          style={{
            backgroundColor: "#121212",
          }}
        >
          {animation2 && <Animation source={animation2} />}
        </View>
      </ScrollView>
      <View style={styles.select}>
        <Button
          type={modelId === "nanoS" ? "primary" : "secondary"}
          title="nanoS"
          disabled={!!Config.OVERRIDE_MODEL_ID || key === "pairDevice"}
          onPress={() => {
            setModelId("nanoS" as DeviceModelId);
          }}
        />
        <Button
          type={modelId === "nanoSP" ? "primary" : "secondary"}
          title="nanoSP"
          disabled={!!Config.OVERRIDE_MODEL_ID || key === "pairDevice"}
          onPress={() => {
            setModelId("nanoSP" as DeviceModelId);
          }}
        />
        <Button
          type={modelId === "nanoX" ? "primary" : "secondary"}
          title="nanoX"
          disabled={!!Config.OVERRIDE_MODEL_ID}
          onPress={() => {
            setModelId("nanoX" as DeviceModelId);
          }}
        />
        <Button
          type="primary"
          title="blue"
          disabled
          onPress={() => {
            setModelId("blue" as DeviceModelId);
          }}
        />
        <Button
          type={modelId === "stax" ? "primary" : "secondary"}
          title="stax"
          disabled={!!Config.OVERRIDE_MODEL_ID}
          onPress={() => {
            setModelId("stax" as DeviceModelId);
          }}
        />
      </View>
      <Button
        containerStyle={{
          marginTop: 8,
        }}
        type="primary"
        title={`Show ${wired ? "Bluetooth" : "Wired"}`}
        disabled={modelId !== "nanoX" || !keys.includes(key)}
        onPress={() => setWired(wired => !wired)}
      />
      <Flex mt={8} flexDirection="row">
        <Button
          disabled={keyIndex === 0}
          onPress={() => {
            setKey(allKeys[Math.max(keyIndex - 1, 0)]);
          }}
          type="primary"
          Icon={Icons.ChevronLeftMedium}
        />
        <Flex mx={3} flex={1}>
          <Button
            type="primary"
            title="Animation key"
            onPress={() => setKeyModalVisible(true)}
          />
        </Flex>
        <Button
          disabled={keyIndex === allKeys.length - 1}
          onPress={() => {
            setKey(allKeys[Math.min(keyIndex + 1, allKeys.length - 1)]);
          }}
          type="primary"
          Icon={Icons.ChevronRightMedium}
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
