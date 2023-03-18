import React, { useCallback, useEffect, useRef } from "react";
import { Divider, Flex, Icons, Log, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  useAllPostOnboardingActionsCompleted,
  usePostOnboardingHubState,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { useDispatch } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import PostOnboardingActionRow from "../../components/PostOnboarding/PostOnboardingActionRow";
import { NavigatorName, ScreenName } from "../../const";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { PostOnboardingNavigatorParamList } from "../../components/RootNavigator/types/PostOnboardingNavigator";
import DeviceSetupView from "../../components/DeviceSetupView";
import { useCompleteActionCallback } from "../../logic/postOnboarding/useCompleteAction";
import { track, TrackScreen } from "../../analytics";
import Link from "../../components/wrappedUi/Link";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    PostOnboardingNavigatorParamList,
    ScreenName.PostOnboardingHub
  >
>;

const PostOnboardingHub = ({ navigation, route }: NavigationProps) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const completePostOnboardingAction = useCompleteActionCallback();

  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

  useEffect(
    /**
     * The last action context (specific title & popup) should only be visible
     * the 1st time the hub is navigated to after that action was completed.
     * So here we clear the last action completed.
     * */
    () => clearLastActionCompleted,
    [clearLastActionCompleted],
  );

  useEffect(
    /**
     * Complete claim NFT action if the route param completed is true
     * */
    () => {
      if (route?.params?.completed === "true") {
        track("deeplink", { action: "Claim NFT return to setup" });
        completePostOnboardingAction(PostOnboardingActionId.claimNft);
      }
    },
    [clearLastActionCompleted, completePostOnboardingAction, route],
  );

  const allowClosingScreen = useRef<boolean>(true);

  const navigateToMainScreen = useCallback(() => {
    allowClosingScreen.current = true;
    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [navigation]);

  /**
   * At 0: regular screen
   * At 0.5: opaque black/white backdrop drawn on top
   * At 1: "finished" text drawn on top of backdrop
   */
  const animDoneValue = useSharedValue(0);

  const allDone = useAllPostOnboardingActionsCompleted();

  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAnimationTimeout = useCallback(() => {
    !allDone &&
      animationTimeout.current &&
      clearTimeout(animationTimeout.current);
  }, [allDone]);

  const triggerEndAnimation = useCallback(() => {
    const onAnimEnd = () => {
      clearAnimationTimeout();
      animationTimeout.current = setTimeout(() => {
        navigateToMainScreen();
      }, 3000);
    };
    animDoneValue.value = withDelay(
      2000,
      withTiming(1, { duration: 1500 }, finished => {
        if (finished) {
          runOnJS(onAnimEnd)();
        }
      }),
    );

    /**
     * Preventing screen closing:
     * - removing header right (close button)
     * - disabling gestures (necessary for iOS)
     * - adding listener to "beforeRemove" (necessary for Android as the back button would still close otherwise)
     */
    navigation.setOptions({ gestureEnabled: false, headerRight: () => null });
    navigation.getParent()?.setOptions({ gestureEnabled: false });
    allowClosingScreen.current = false;
    const listenerCleanup = navigation.addListener("beforeRemove", e => {
      if (!allowClosingScreen.current) e.preventDefault();
    });
    return () => {
      listenerCleanup();
      clearAnimationTimeout();
      cancelAnimation(animDoneValue);
    };
  }, [
    clearAnimationTimeout,
    navigation,
    navigateToMainScreen,
    animDoneValue,
    animationTimeout,
  ]);

  useEffect(() => clearAnimationTimeout);

  const triggerEndAnimationWrapped = useCallback(() => {
    if (allDone) triggerEndAnimation();
  }, [allDone, triggerEndAnimation]);

  useFocusEffect(triggerEndAnimationWrapped);

  const doneContainerStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(animDoneValue.value, [0, 0.5, 1], [0, 1, 1]),
    }),
    [animDoneValue],
  );

  const doneContentStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(animDoneValue.value, [0, 0.5, 1], [0, 0, 1]),
    }),
    [animDoneValue],
  );

  const productName = getDeviceModel(
    deviceModelId || DeviceModelId.nanoX,
  )?.productName;

  return (
    <DeviceSetupView hasCloseButton>
      <TrackScreen
        key={allDone.toString()}
        category={
          allDone
            ? "User has completed all post-onboarding actions"
            : "Post-onboarding hub"
        }
      />
      <Flex px={6} py={7} justifyContent="space-between" flex={1}>
        <Text variant="h1Inter" fontWeight="semiBold" mb={8}>
          {allDone
            ? t("postOnboarding.hub.allDoneTitle", {
                productName,
              })
            : t("postOnboarding.hub.title", { productName })}
        </Text>
        <ScrollView>
          {actionsState.map((action, index, arr) => (
            <React.Fragment key={index}>
              <PostOnboardingActionRow {...action} />
              {index !== arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </ScrollView>
        <Flex mt={8} alignItems="center" justifyContent="center">
          {allDone ? null : (
            <Link
              size="large"
              onPress={navigateToMainScreen}
              event="button_clicked"
              eventProperties={{ button: "I'll do this later" }}
            >
              {t("postOnboarding.hub.skip")}
            </Link>
          )}
        </Flex>
      </Flex>
      {allDone && (
        <AnimatedFlex
          style={[doneContainerStyle, StyleSheet.absoluteFillObject]}
          justifyContent="center"
          alignItems="center"
        >
          <Flex
            backgroundColor="background.main"
            style={StyleSheet.absoluteFillObject}
          />
          <AnimatedFlex style={doneContentStyle}>
            <Flex flexDirection="column" alignItems="center" p={8}>
              <Icons.CircledCheckSolidMedium color="success.c100" size={54} />
              <Flex height={83} />
              <Log>{t("postOnboarding.hub.done")}</Log>
              <Flex height={100} />
            </Flex>
          </AnimatedFlex>
        </AnimatedFlex>
      )}
    </DeviceSetupView>
  );
};

export default PostOnboardingHub;
