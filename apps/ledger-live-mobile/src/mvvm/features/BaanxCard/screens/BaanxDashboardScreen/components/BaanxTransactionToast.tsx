import React, { useEffect, useCallback } from "react";
import { StyleSheet, View, Platform, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { TAB_BAR_HEIGHT } from "~/components/TabBar/shared";

const AUTO_DISMISS_MS = 5_000;
const ANIM_DURATION = 300;

interface Props {
  readonly message: string;
  readonly onDismiss: () => void;
}

export default function BaanxTransactionToast({ message, onDismiss }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  const dismiss = useCallback(() => {
    progress.value = withTiming(0, { duration: ANIM_DURATION, easing: Easing.out(Easing.ease) });
    setTimeout(onDismiss, ANIM_DURATION);
  }, [onDismiss, progress]);

  useEffect(() => {
    progress.value = withTiming(1, { duration: ANIM_DURATION, easing: Easing.out(Easing.ease) });
    const timeout = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [dismiss, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 30 }],
  }));

  return (
    <Modal transparent visible statusBarTranslucent animationType="none">
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.pill,
            {
              bottom: TAB_BAR_HEIGHT + insets.bottom + 24,
              backgroundColor: theme.colors.text.base,
            },
            animatedStyle,
          ]}
        >
          <CheckmarkCircleFill size={20} color="success" />
          <Text
            typography="body2SemiBold"
            style={{ color: theme.colors.bg.base }}
            numberOfLines={1}
          >
            {message}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
});
