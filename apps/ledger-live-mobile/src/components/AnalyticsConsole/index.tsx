import React, { useCallback, useState } from "react";
import { StyleSheet, Pressable } from "react-native";
import { Flex, Switch, Icons, Divider } from "@ledgerhq/native-ui";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import FloatingDebugButton from "../FloatingDebugButton";
import EventList from "./EventList";
import Status from "./Status";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

enum Visibility {
  opaque,
  transparent,
  hidden,
}

const AnalyticsConsole = () => {
  const render = useEnv("ANALYTICS_CONSOLE");
  const [visibility, setVisibility] = useState<Visibility>(
    Visibility.transparent,
  );
  const [showExtraProps, setShowExtraProps] = useState(false);
  const onPressDebugButton = useCallback(() => {
    switch (visibility) {
      case Visibility.hidden:
        setVisibility(Visibility.transparent);
        break;
      case Visibility.transparent:
        setVisibility(Visibility.opaque);
        break;
      case Visibility.opaque:
      default:
        setVisibility(Visibility.hidden);
        break;
    }
  }, [visibility]);

  const handleClose = useCallback(() => {
    setVisibility(Visibility.transparent);
  }, []);

  // if (!render) return null;
  return (
    <>
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        flex={1}
        zIndex={999}
        opacity={
          visibility === Visibility.opaque
            ? 1
            : visibility === Visibility.transparent
            ? 0.4
            : 0
        }
        pointerEvents={visibility === Visibility.opaque ? "auto" : "none"}
      >
        <Flex
          style={StyleSheet.absoluteFillObject}
          bg={"white"}
          opacity={visibility === Visibility.opaque ? 1 : 0.8}
        />
        <SafeAreaView>
          <AnimatedFlex>
            {visibility === Visibility.opaque ? (
              <AnimatedFlex entering={FadeIn} exiting={FadeOut} p={4}>
                <Flex
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={3}
                >
                  <Switch
                    checked={showExtraProps}
                    onChange={setShowExtraProps}
                    label="Extra props"
                  />
                  <Pressable onPress={handleClose}>
                    <Icons.CloseMedium size={25} color="black" />
                  </Pressable>
                </Flex>
                <Status />
                <Divider />
              </AnimatedFlex>
            ) : null}
          </AnimatedFlex>
          <AnimatedFlex flexShrink={1} layout={Layout}>
            <EventList showExtraProps={showExtraProps} />
          </AnimatedFlex>
        </SafeAreaView>
      </Flex>
      <FloatingDebugButton
        onPress={onPressDebugButton}
        Icon={Icons.ActivityMedium}
      />
    </>
  );
};

export default AnalyticsConsole;
