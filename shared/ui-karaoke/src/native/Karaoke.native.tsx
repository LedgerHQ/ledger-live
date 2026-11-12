import React, { createContext, useContext, useMemo, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { KaraokeGlow } from "./KaraokeGlow";
import { KaraokeLines } from "./KaraokeLines";
import type { KaraokeFinalProps, KaraokeRootProps, KaraokeSequenceProps } from "../Karaoke.types";
import { karaokeTestIds } from "../karaokeTestIds";

/** Lumen large button height. */
const FOOTER_HEIGHT = 56;
const FOOTER_BOTTOM_GAP = 16;
const FADE_MS = 600;

type KaraokeState = Readonly<{
  phrases: readonly string[];
  activeIndex: number;
  isLastPhrase: boolean;
  isDone: boolean;
  tapLabel: string;
  advance: () => void;
}>;

const KaraokeContext = createContext<KaraokeState | null>(null);

function useKaraoke(): KaraokeState {
  const karaoke = useContext(KaraokeContext);
  if (!karaoke) throw new Error("Karaoke parts must be inside Karaoke.Root");
  return karaoke;
}

function Root({ phrases, tapLabel, testID, children }: KaraokeRootProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const isLastPhrase = activeIndex >= phrases.length - 1;

  const karaoke = useMemo(
    () => ({
      phrases,
      activeIndex,
      isLastPhrase,
      isDone,
      tapLabel,
      advance: () => {
        if (isLastPhrase) {
          setIsDone(true);
          return;
        }
        setActiveIndex(activeIndex + 1);
        // The tap area is one big button, so screen readers would not read the new line.
        AccessibilityInfo.announceForAccessibility(phrases[activeIndex + 1]);
      },
    }),
    [phrases, activeIndex, isLastPhrase, isDone, tapLabel],
  );

  return (
    <KaraokeContext.Provider value={karaoke}>
      {/* Exit fades are for changes inside the story, not for leaving the screen. */}
      <LayoutAnimationConfig skipExiting>
        <Box testID={testID} lx={{ flex: 1, backgroundColor: "canvas" }}>
          <KaraokeGlow />
          {children}
        </Box>
      </LayoutAnimationConfig>
    </KaraokeContext.Provider>
  );
}

function Sequence({ action }: KaraokeSequenceProps) {
  const { phrases, activeIndex, isLastPhrase, isDone, tapLabel, advance } = useKaraoke();
  const { bottom } = useSafeAreaInsets();
  // `{show && <Button />}` gives null or false: that means "no action", not an empty one.
  const hasAction = action !== undefined && action !== null && action !== false;
  const showsAction = isLastPhrase && hasAction;
  // On the action phrase, a tap would do nothing: hide the tap area from touch and screen readers.
  const canTap = !showsAction;

  if (isDone && !hasAction) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      exiting={FadeOut.duration(FADE_MS / 2)}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        disabled={!canTap}
        accessibilityState={{ disabled: !canTap }}
        accessible={canTap}
        accessibilityElementsHidden={!canTap}
        importantForAccessibility={canTap ? "auto" : "no-hide-descendants"}
        accessibilityRole="button"
        accessibilityLabel={tapLabel}
        testID={karaokeTestIds.advance}
        onPress={advance}
      />
      <KaraokeLines phrases={phrases} activeIndex={activeIndex} />
      <View
        pointerEvents="box-none"
        style={[styles.footer, { marginBottom: bottom + FOOTER_BOTTOM_GAP }]}
      >
        {showsAction ? (
          <Animated.View key="action" entering={FadeIn.duration(FADE_MS)}>
            {action}
          </Animated.View>
        ) : (
          <Animated.View key="hint" pointerEvents="none" exiting={FadeOut.duration(FADE_MS / 2)}>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {tapLabel}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

function Final({ children }: KaraokeFinalProps) {
  const { isDone } = useKaraoke();
  if (!isDone) return null;

  return (
    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(FADE_MS)}>
      {children}
    </Animated.View>
  );
}

export const Karaoke = { Root, Sequence, Final };

const styles = StyleSheet.create({
  footer: {
    marginTop: "auto",
    height: FOOTER_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
