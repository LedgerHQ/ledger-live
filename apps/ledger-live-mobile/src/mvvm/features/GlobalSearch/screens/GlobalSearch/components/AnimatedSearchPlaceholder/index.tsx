import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import { GLOBAL_SEARCH_TEST_IDS } from "../../testIds";
import { useCyclingPlaceholder } from "./useCyclingPlaceholder";

const SEARCH_ICON_SIZE = 20;
const SLOT_HEIGHT = 48;
const ANIMATION_DURATION_MS = 400;
const EASING = Easing.bezier(0, 0, 0.58, 1);

// The outgoing word slides up and fades out, the incoming word slides in from
// below; both play in parallel. See LIVE-32544 spec.
const SLIDE_IN = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: SLOT_HEIGHT }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: EASING },
}).duration(ANIMATION_DURATION_MS);

const SLIDE_OUT = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }] },
  75: { opacity: 0, transform: [{ translateY: -SLOT_HEIGHT * 0.75 }], easing: EASING },
  100: { opacity: 0, transform: [{ translateY: -SLOT_HEIGHT }], easing: EASING },
}).duration(ANIMATION_DURATION_MS);

type Props = Readonly<{
  /** When false (the field has a value), the placeholder hides instantly and cycling pauses. */
  visible: boolean;
}>;

export function AnimatedSearchPlaceholder({ visible }: Props) {
  const { t } = useTranslation();

  const phrases = useMemo(
    () => [
      t("globalSearch.searchPlaceholders.crypto"),
      t("globalSearch.searchPlaceholders.stablecoins"),
      t("globalSearch.searchPlaceholders.stock"),
      t("globalSearch.searchPlaceholders.addresses"),
    ],
    [t],
  );

  const { index, animate } = useCyclingPlaceholder(phrases.length, visible);

  // The first phrase is shown at rest; only phrases that appear after a cycle slide in.
  const isInitialRender = useRef(true);
  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  const styles = useStyleSheet(
    theme => ({
      overlay: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
      },
      layer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: theme.spacings.s16 + SEARCH_ICON_SIZE + theme.spacings.s12,
        right: theme.spacings.s16 + theme.spacings.s20 + theme.spacings.s12,
        justifyContent: "center",
      },
    }),
    [],
  );

  const phrase = (
    <Text typography="body1" lx={{ color: "muted" }} numberOfLines={1}>
      {phrases[index]}
    </Text>
  );

  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, { opacity: visible ? 1 : 0 }]}
      testID={GLOBAL_SEARCH_TEST_IDS.searchPlaceholder}
    >
      {animate ? (
        <Animated.View
          key={index}
          style={styles.layer}
          entering={isInitialRender.current ? undefined : SLIDE_IN}
          exiting={SLIDE_OUT}
        >
          {phrase}
        </Animated.View>
      ) : (
        <View style={styles.layer}>{phrase}</View>
      )}
    </View>
  );
}
