// @flow
import React, { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
} from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";
import { useTheme } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../const";
import ArrowLeft from "../../icons/ArrowLeft";
import Question from "../../icons/Question";
import Styles from "../../navigation/styles";

import { InfoStepView } from "./OnboardingStepView";
import type { InfoStepViewProps } from "./OnboardingStepView";
import AnimatedSvgBackground from "../AnimatedSvgBackground";

export type OnboardingScene = {
  id: string,
  sceneProps: InfoStepViewProps,
  type: "primary" | "secondary",
  sceneInfoKey?: string,
};

type Props = {
  scenes: OnboardingScene[],
  navigation: *,
  route: *,
  onFinish: () => void,
  hideStepper?: boolean,
  hideBackButton?: boolean,
};

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

const initialLayout = { width: Dimensions.get("window").width };
const headerHeight = 94;

export default function OnboardingStepperView({
  scenes,
  navigation,
  onFinish,
  hideStepper,
  hideBackButton,
}: Props) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState(scenes.map(({ id }) => ({ key: id })));

  const onNext = useCallback(() => {
    if (index === scenes.length - 1) {
      onFinish();
    } else {
      setIndex(Math.min(scenes.length - 1, index + 1));
    }
  }, [index, scenes.length, onFinish]);

  const onBack = useCallback(() => {
    if (index === 0) navigation.goBack();
    else setIndex(Math.max(0, index - 1));
  }, [navigation, index]);

  const currentScene = useMemo(() => scenes[index], [scenes, index]);

  const openInfoModal = useCallback(() => {
    navigation.navigate(NavigatorName.Onboarding, {
      screen: ScreenName.OnboardingInfoModal,
      params: {
        sceneInfoKey: currentScene?.sceneInfoKey,
      },
    });
  }, [currentScene?.sceneInfoKey, navigation]);

  const sceneColors =
    currentScene?.type === "primary"
      ? [
          colors.live,
          "#fff",
          "#fff",
          "#fff",
          "rgba(255,255,255,0.3)",
          "#587ED4",
          colors.live,
        ]
      : [
          colors.card,
          colors.live,
          colors.darkBlue,
          colors.lightLive,
          "rgba(100, 144, 241, 0.3)",
          "rgba(67, 133, 240, 0.08)",
          "#fff",
        ];

  const renderScenes = SceneMap(
    scenes.reduce(
      (s, { sceneProps, id }) => ({
        ...s,
        [id]: () => (
          <InfoStepView
            {...sceneProps}
            onNext={onNext}
            sceneColors={sceneColors}
          />
        ),
      }),
      {},
    ),
  );

  return scenes && scenes.length ? (
    <SafeAreaView style={[styles.root, { backgroundColor: sceneColors[0] }]}>
      <View style={[styles.header]}>
        <View style={styles.topHeader}>
          {hideBackButton ? null : (
            <Pressable
              hitSlop={hitSlop}
              style={styles.buttons}
              onPress={onBack}
            >
              <ArrowLeft size={18} color={sceneColors[1]} />
            </Pressable>
          )}
          {currentScene?.sceneInfoKey && (
            <Pressable
              hitSlop={hitSlop}
              style={styles.buttons}
              onPress={openInfoModal}
            >
              <Question size={20} color={sceneColors[1]} />
            </Pressable>
          )}
        </View>
        <View style={styles.indicatorContainer}>
          {hideStepper
            ? null
            : scenes.map(({ id }, i) => (
                <View
                  key={"indicator" + id + i}
                  style={[
                    styles.sceneIndicator,
                    {
                      backgroundColor:
                        index === i ? sceneColors[1] : sceneColors[4],
                    },
                  ]}
                />
              ))}
        </View>
      </View>
      <AnimatedSvgBackground style={styles.svg} color={sceneColors[5]} />
      <TabView
        renderTabBar={() => null}
        navigationState={{ index, routes }}
        renderScene={renderScenes}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        swipeEnabled={false}
        lazy
        lazyPreloadDistance={1}
      />
    </SafeAreaView>
  ) : null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
  },
  spacer: { flex: 1 },
  header: {
    ...Styles.headerNoShadow,
    backgroundColor: "transparent",
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 0 : 40,
    height: headerHeight,
    flexDirection: "column",
    overflow: "hidden",
    paddingHorizontal: 24,
  },
  buttons: {
    paddingVertical: 16,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sceneIndicator: { flex: 1, height: 2, marginHorizontal: 4 },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "40%",
    zIndex: -1,
  },
});
