import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { AnimationTheme, StateAnimation } from "LLM/components/ConnectNewDevice/animations";
import { SpotAnimation } from "LLM/components/ConnectNewDevice/components/SpotAnimation";

const ANIMATIONS: StateAnimation[] = ["bluetooth", "bluetoothAndUsb", "usb", "loading", "success"];
const THEMES: AnimationTheme[] = ["light", "dark"];

// Values of the Lumen canvas token in each theme.
const CANVAS_COLORS: Record<AnimationTheme, string> = { light: "#FFFFFF", dark: "#000000" };

// Spot sizes: 96 is the size in ConnectNewDevice. The large preview shows the details.
const PREVIEW_SPOT_SIZES = [96, 240];

export default function DebugConnectNewDeviceAnimationsScreen() {
  const { colorScheme } = useTheme();
  const [animation, setAnimation] = useState<StateAnimation>("bluetooth");
  const [theme, setTheme] = useState<AnimationTheme>(colorScheme === "dark" ? "dark" : "light");
  const [loop, setLoop] = useState(true);
  const [replayCount, setReplayCount] = useState(0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Box lx={cardStyle}>
        <ControlRow title="Animation">
          {ANIMATIONS.map(option => (
            <ChoiceButton
              key={option}
              label={option}
              selected={option === animation}
              onPress={() => setAnimation(option)}
            />
          ))}
        </ControlRow>
        <ControlRow title="Theme">
          {THEMES.map(option => (
            <ChoiceButton
              key={option}
              label={option}
              selected={option === theme}
              onPress={() => setTheme(option)}
            />
          ))}
        </ControlRow>
        <ControlRow title="Playback">
          <ChoiceButton
            label={loop ? "Loop: On" : "Loop: Off"}
            selected={loop}
            onPress={() => setLoop(value => !value)}
          />
          <Button appearance="gray" size="sm" onPress={() => setReplayCount(count => count + 1)}>
            Replay
          </Button>
        </ControlRow>
      </Box>

      <View style={[styles.preview, { backgroundColor: CANVAS_COLORS[theme] }]}>
        {PREVIEW_SPOT_SIZES.map(spotSize => (
          <SpotAnimation
            key={`${spotSize}-${animation}-${theme}-${loop}-${replayCount}`}
            animation={animation}
            theme={theme}
            spotSize={spotSize}
            loop={loop}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ControlRow({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <Box lx={{ gap: "s8" }}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {title}
      </Text>
      <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>{children}</Box>
    </Box>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  return (
    <Button appearance={selected ? "base" : "gray"} size="sm" onPress={onPress}>
      {label}
    </Button>
  );
}

const cardStyle = {
  backgroundColor: "surface",
  borderRadius: "md",
  gap: "s16",
  padding: "s16",
  width: "full",
} as const;

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  preview: {
    alignItems: "center",
    borderRadius: 16,
    gap: 32,
    justifyContent: "center",
    paddingVertical: 32,
  },
});
