import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { DebugLottieDeviceTab } from "./DebugLottieDeviceTab";
import { DebugLottieLocalFileTab } from "./DebugLottieLocalFileTab";
import {
  consumeStashedDebugLottiePick,
  InvalidLottieExtensionError,
  pickLocalLottieFile,
  type PickedLottieFile,
} from "./pickLocalLottieFile";

const edges: Edge[] = ["bottom"];

type DebugLottieTab = "device" | "local";

export default function DebugLottie() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<DebugLottieTab>("device");
  const [localSelection, setLocalSelection] = useState<PickedLottieFile | null>(null);
  const [localReplayKey, setLocalReplayKey] = useState(0);
  const [isPicking, setIsPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const commitLocalSelection = useCallback((file: PickedLottieFile) => {
    setLocalSelection(file);
    setLocalReplayKey(previous => previous + 1);
    setPickError(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const stashed = consumeStashedDebugLottiePick();
      if (stashed) {
        commitLocalSelection(stashed);
      }
    }, [commitLocalSelection]),
  );

  const handleBrowseLocalFile = useCallback(async () => {
    setIsPicking(true);
    setPickError(null);

    try {
      const file = await pickLocalLottieFile();
      if (file) {
        commitLocalSelection(file);
        consumeStashedDebugLottiePick();
      }
    } catch (error) {
      const message =
        error instanceof InvalidLottieExtensionError || error instanceof Error
          ? error.message
          : "Failed to pick file";
      setPickError(message);
    } finally {
      setIsPicking(false);
    }
  }, [commitLocalSelection]);

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
      <Flex flexDirection="row" mb={4} columnGap={8}>
        <Flex flex={1}>
          <Button
            type="primary"
            outline={activeTab !== "device"}
            title="Device"
            onPress={() => setActiveTab("device")}
          />
        </Flex>
        <Flex flex={1}>
          <Button
            type="primary"
            outline={activeTab !== "local"}
            title="Local file"
            onPress={() => setActiveTab("local")}
          />
        </Flex>
      </Flex>

      {activeTab === "device" ? (
        <DebugLottieDeviceTab />
      ) : (
        <DebugLottieLocalFileTab
          selection={localSelection}
          replayKey={localReplayKey}
          onReplay={() => setLocalReplayKey(previous => previous + 1)}
          onBrowsePress={handleBrowseLocalFile}
          isPicking={isPicking}
          pickError={pickError}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 8,
  },
});
