import React, { useCallback, useEffect } from "react";
import { View, Animated, Easing } from "react-native";
import { Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaanxTopUpParamList } from "../types";

type Props = StackNavigatorProps<BaanxTopUpParamList, ScreenName.BaanxTopUpValidationSuccess>;

export function TopUpSuccessScreen({ navigation, route }: Props) {
  const coinTicker = route.params.coinTicker ?? "";

  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const subtitleFade = React.useRef(new Animated.Value(0)).current;
  const buttonFade = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, subtitleFade, buttonFade]);

  const styles = useStyleSheet(
    t => ({
      root: {
        flex: 1,
        backgroundColor: t.colors.bg.base,
        justifyContent: "center",
        alignItems: "center",
      },
      icon: { marginBottom: t.spacings.s16 },
      subtitle: { marginTop: t.spacings.s8 },
      bottom: {
        position: "absolute" as const,
        bottom: t.spacings.s32,
        left: t.spacings.s16,
        right: t.spacings.s16,
      },
    }),
    [],
  );

  const handleClose = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <Animated.View style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}>
        <CheckmarkCircleFill size={64} color="success" />
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text typography="heading2" lx={{ color: "base" }}>
          Topped up
        </Text>
      </Animated.View>
      {coinTicker ? (
        <Animated.View style={{ opacity: subtitleFade }}>
          <Text typography="body2" lx={{ color: "muted" }} style={styles.subtitle}>
            You'll see your {coinTicker} in a few seconds
          </Text>
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.bottom, { opacity: buttonFade }]}>
        <Button appearance="base" size="lg" onPress={handleClose}>
          Done
        </Button>
      </Animated.View>
    </SafeAreaView>
  );
}
