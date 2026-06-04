import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { Lottie } from "LLM/components/Lottie";
import type { PickedLottieFile } from "./pickLocalLottieFile";

const LOTTIE_SIZE = 208;

const PREVIEW_VARIANTS = [
  { id: "light", backgroundColor: "white", testID: "debug-lottie-local-light" },
  { id: "dark", backgroundColor: "#121212", testID: "debug-lottie-local-dark" },
] as const;

type DebugLottieLocalFileTabProps = {
  selection: PickedLottieFile | null;
  replayKey: number;
  onReplay: () => void;
  onBrowsePress: () => void;
  isPicking: boolean;
  pickError: string | null;
};

export function DebugLottieLocalFileTab({
  selection,
  replayKey,
  onReplay,
  onBrowsePress,
  isPicking,
  pickError,
}: DebugLottieLocalFileTabProps) {
  const [loop, setLoop] = useState(false);
  const source = selection ? { uri: selection.uri } : null;

  return (
    <>
      <Text mb={4} alignSelf="center">
        {selection ? `Showing '${selection.name}'` : "Browse a .lottie file"}
      </Text>

      <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
        {selection && source ? (
          PREVIEW_VARIANTS.map(variant => (
            <Flex key={variant.id} style={[styles.previewBox, { backgroundColor: variant.backgroundColor }]}>
              <Lottie
                key={`${variant.id}-${replayKey}`}
                testID={variant.testID}
                source={source}
                loop={loop}
                autoPlay
                style={styles.lottie}
              />
            </Flex>
          ))
        ) : (
          <Text color="neutral.c70" alignSelf="center">
            No animation selected yet
          </Text>
        )}
      </ScrollView>

      {selection?.uri ? (
        <Text mb={3} color="neutral.c70" numberOfLines={2}>
          {selection.uri}
        </Text>
      ) : null}

      {pickError ? (
        <Text mb={3} color="error.c80">
          {pickError}
        </Text>
      ) : null}

      <Button
        type="primary"
        title={isPicking ? "Opening..." : "Browse .lottie file"}
        disabled={isPicking}
        onPress={onBrowsePress}
      />

      <Flex mt={4} flexDirection="row" columnGap={8}>
        <Flex flex={1}>
          <Button
            type="primary"
            outline={!loop}
            title={loop ? "Loop: on" : "Loop: off"}
            disabled={!selection}
            onPress={() => setLoop(previous => !previous)}
          />
        </Flex>
        <Flex flex={1}>
          <Button type="primary" title="Replay" disabled={!selection} onPress={onReplay} />
        </Flex>
      </Flex>
    </>
  );
}

const styles = StyleSheet.create({
  previewScroll: {
    flex: 1,
    backgroundColor: "grey",
    marginBottom: 12,
  },
  previewContent: {
    paddingVertical: 8,
  },
  previewBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  lottie: {
    width: LOTTIE_SIZE,
    height: LOTTIE_SIZE,
  },
});
