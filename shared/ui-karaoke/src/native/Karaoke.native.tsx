import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, LayoutAnimationConfig } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { GLOW_FADE_MS, Glow } from "@shared/ui-glow/native";
import { KaraokeGlow } from "./KaraokeGlow";
import { KaraokeLines } from "./KaraokeLines";
import type { KaraokeFinalProps, KaraokeRootProps } from "../Karaoke.types";
import { karaokeTestIds } from "../karaokeTestIds";

/** Lumen large button height. */
const FOOTER_HEIGHT = 56;
const FOOTER_BOTTOM_GAP = 16;
/** The text fades (story and Final). The glow has its own, slower fade: GLOW_FADE_MS. */
const TEXT_FADE_MS = 600;
const HINT_EXIT_MS = TEXT_FADE_MS / 2;
/** The action fades in with the bottom glow, once that glow is half in. */
const actionFadeIn = FadeIn.delay(GLOW_FADE_MS / 2)
  .duration(GLOW_FADE_MS)
  .easing(Easing.bezier(0.42, 0, 0.58, 1));
/** On Final, the glow moves down once the title is read. */
const FINAL_READING_MS = 2000;

// Bigger than the playground defaults; the top glow is shorter, behind the phrases.
const GLOW_SIZE = { reach: 0.3, width: 1, topReach: 0.65 };

type KaraokeState = Readonly<{
  phrases: readonly string[];
  activeIndex: number;
  isLastPhrase: boolean;
  isDone: boolean;
  tapLabel: string;
  action: ReactNode;
  hasAction: boolean;
  advance: () => void;
}>;

const KaraokeContext = createContext<KaraokeState | null>(null);

function useKaraoke(): KaraokeState {
  const karaoke = useContext(KaraokeContext);
  if (!karaoke) throw new Error("Karaoke parts must be inside Karaoke.Root");
  return karaoke;
}

function Root({ phrases, tapLabel, action, testID, children }: KaraokeRootProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const isLastPhrase = activeIndex >= phrases.length - 1;
  // `{show && <Button />}` gives null or false: that means "no action", not an empty one.
  const hasAction = action !== undefined && action !== null && action !== false;
  // The glow moves down when the action shows, or once the `Final` title is read.
  const isGlowAtBottom = (isLastPhrase && hasAction) || isDone;
  const glowDelayMs = hasAction ? 0 : FINAL_READING_MS;

  const karaoke = useMemo(
    () => ({
      phrases,
      activeIndex,
      isLastPhrase,
      isDone,
      tapLabel,
      action,
      hasAction,
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
    [phrases, activeIndex, isLastPhrase, isDone, tapLabel, action, hasAction],
  );

  return (
    <KaraokeContext.Provider value={karaoke}>
      {/* Exit fades are for changes inside the story, not for leaving the screen. */}
      <LayoutAnimationConfig skipExiting>
        <Box testID={testID} lx={{ flex: 1, backgroundColor: "canvas" }}>
          <Glow
            testID={karaokeTestIds.glow}
            showTop={!isGlowAtBottom}
            showBottom={isGlowAtBottom}
            delayMs={glowDelayMs}
            params={GLOW_SIZE}
            fallback={<KaraokeGlow isAtBottom={isGlowAtBottom} delayMs={glowDelayMs} />}
          />
          {children}
        </Box>
      </LayoutAnimationConfig>
    </KaraokeContext.Provider>
  );
}

function Sequence() {
  const { phrases, activeIndex, isLastPhrase, isDone, tapLabel, action, hasAction, advance } =
    useKaraoke();
  const { bottom } = useSafeAreaInsets();
  const showsAction = isLastPhrase && hasAction;
  // On the action phrase, a tap would do nothing: hide the tap area from touch and screen readers.
  const canTap = !showsAction;

  if (isDone && !hasAction) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      exiting={FadeOut.duration(HINT_EXIT_MS)}
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
          <Animated.View key="action" entering={actionFadeIn}>
            {action}
          </Animated.View>
        ) : (
          <Animated.View key="hint" pointerEvents="none" exiting={FadeOut.duration(HINT_EXIT_MS)}>
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
    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(TEXT_FADE_MS)}>
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
