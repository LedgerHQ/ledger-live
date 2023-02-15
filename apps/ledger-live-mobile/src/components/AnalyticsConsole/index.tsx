import React, { useCallback, useState } from "react";
import { StyleSheet, Pressable } from "react-native";
import { Flex, Switch, Icons, Divider, Alert, Text } from "@ledgerhq/native-ui";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import Slider from "react-native-slider";
import FloatingDebugButton from "../FloatingDebugButton";
import EventList from "./EventList";
import Status from "./Status";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

enum Visibility {
  opaque = "opaque",
  transparent = "transparent",
  hidden = "hidden",
}

const AnalyticsConsole = () => {
  const render = useEnv("ANALYTICS_CONSOLE");
  const [visibility, setVisibility] = useState<Visibility>(
    Visibility.transparent,
  );
  const [previewTransparent, setPreviewTransparent] = useState(false);
  const [transparentHeightPercentage, setTransparentHeightPercentage] =
    useState(60);
  const [showExtraProps, setShowExtraProps] = useState(false);
  const [hideSyncEvents, setHideSyncEvents] = useState(false);
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

  const handleSlidingStart = useCallback(() => {
    setPreviewTransparent(true);
  }, []);
  const handleSlidingComplete = useCallback(() => {
    setPreviewTransparent(false);
  }, []);
  const handleSliderValueChange = useCallback(val => {
    setTransparentHeightPercentage(Math.min(100, Math.max(0, Math.round(val))));
  }, []);

  const { bottom } = useSafeAreaInsets();

  if (!render) return null;
  return (
    <>
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={
          visibility === Visibility.opaque && !previewTransparent
            ? 0
            : `${100 - transparentHeightPercentage}%`
        }
        flex={1}
        overflow="hidden"
        opacity={
          visibility === Visibility.opaque
            ? 1
            : visibility === Visibility.transparent || previewTransparent
            ? 0.7
            : 0
        }
        pointerEvents={visibility === Visibility.opaque ? "auto" : "none"}
      >
        <Flex
          style={StyleSheet.absoluteFillObject}
          bg={"white"}
          opacity={
            visibility === Visibility.opaque && !previewTransparent ? 1 : 0.6
          }
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
                <Flex>
                  <Switch
                    checked={hideSyncEvents}
                    onChange={setHideSyncEvents}
                    label="Hide Sync* events"
                  />
                  <Text>Height of the transparent overlay:</Text>
                  <Slider
                    step={1}
                    value={transparentHeightPercentage}
                    minimumValue={1}
                    maximumValue={100}
                    onSlidingStart={handleSlidingStart}
                    onSlidingComplete={handleSlidingComplete}
                    onValueChange={handleSliderValueChange}
                  />
                </Flex>
                <Status />
                <Divider />
              </AnimatedFlex>
            ) : null}
          </AnimatedFlex>
          <AnimatedFlex flexShrink={1} layout={Layout}>
            <EventList
              showExtraProps={showExtraProps}
              hideSyncEvents={hideSyncEvents}
            />
          </AnimatedFlex>
        </SafeAreaView>
      </Flex>
      <AnimatedFlex
        position={"absolute"}
        bottom={0}
        alignSelf="center"
        key={visibility}
        entering={FadeOut.delay(2000)}
        pb={6}
        mb={bottom}
        pointerEvents="none"
      >
        <Alert showIcon={false} title={`Analytics console: ${visibility}`} />
      </AnimatedFlex>
      <FloatingDebugButton
        onPress={onPressDebugButton}
        Icon={Icons.ActivityMedium}
      />
    </>
  );
};

export default AnalyticsConsole;
