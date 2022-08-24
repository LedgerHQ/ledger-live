import React, { useCallback, useEffect, useState } from "react";
import {
  Divider,
  Flex,
  Icons,
  Log,
  Notification,
  Text,
} from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { StackScreenProps } from "@react-navigation/stack";
import {
  useAllPostOnboardingActionsCompleted,
  useClearLastActionCompletedCallback,
  usePostOnboardingHubState,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingActionRow from "../../components/PostOnboarding/PostOnboardingActionRow";
import { NavigatorName } from "../../const";

const SafeContainer = styled(SafeAreaView).attrs({
  edges: ["left", "bottom", "right"],
})`
  flex: 1;
`;

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

const PostOnboardingHub: React.FC<StackScreenProps<{}>> = ({ navigation }) => {
  const { t } = useTranslation();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const [popupOpened, setPopupOpened] = useState(true);
  const { actionCompletedHubTitle, actionCompletedPopupLabel } =
    lastActionCompleted ?? {};

  const clearLastActionCompleted = useClearLastActionCompletedCallback();

  useEffect(
    /**
     * The last action context (specific title & popup) should only be visible
     * the 1st time the hub is navigated to after that action was completed.
     * So here we clear the last action completed.
     * */
    () => clearLastActionCompleted,
    [clearLastActionCompleted],
  );

  useEffect(() => {
    /**
     * Necessary because this component doesn't necessarily unmount when
     * navigating to another screen, so we need to open the popup again in case
     * the user closed it and then completed a new action.
     */
    setPopupOpened(true);
  }, [actionCompletedPopupLabel]);

  const navigateToMainScreen = useCallback(() => {
    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [navigation]);

  const handleClosePopup = useCallback(() => {
    setPopupOpened(false);
  }, [setPopupOpened]);

  const animDoneValue = useSharedValue(0);

  const allDone = useAllPostOnboardingActionsCompleted();

  const triggerEndAnimation = useCallback(() => {
    let dead = false;
    let timeout: ReturnType<typeof setTimeout>;
    const onAnimEnd = () => {
      timeout = setTimeout(() => {
        navigateToMainScreen();
      }, 3000);
    };
    animDoneValue.value = withDelay(
      3000,
      withTiming(1, { duration: 1500 }, finished => {
        if (finished && !dead) {
          runOnJS(onAnimEnd)();
        }
      }),
    );

    return () => {
      dead = true;
      timeout && clearTimeout(timeout);
    };
  }, [navigateToMainScreen, animDoneValue]);

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

  return (
    <SafeContainer>
      <Flex px={6} py={7} justifyContent="space-between" flex={1}>
        <Text variant="h1Inter" fontWeight="semiBold" mb={8}>
          {allDone
            ? t("postOnboarding.hub.allDoneTitle")
            : actionCompletedHubTitle
            ? t(actionCompletedHubTitle)
            : t("postOnboarding.hub.title")}
        </Text>
        <Text variant="paragraph" mb={4} color="neutral.c70">
          {t("postOnboarding.hub.subtitle")}
        </Text>
        <ScrollView>
          {actionsState.map((action, index, arr) => (
            <React.Fragment key={index}>
              <PostOnboardingActionRow {...action} />
              {index !== arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </ScrollView>
        {!!actionCompletedPopupLabel && popupOpened && (
          <Notification
            Icon={Icons.CircledCheckSolidMedium}
            iconColor="success.c50"
            variant="plain"
            title={t(actionCompletedPopupLabel)}
            onClose={handleClosePopup}
          />
        )}
        <Flex mt={8}>
          {allDone ? null : (
            <Text
              variant="large"
              fontWeight="semiBold"
              alignSelf="center"
              onPress={navigateToMainScreen}
              color="primary.c80"
            >
              {t("postOnboarding.hub.skip")}
            </Text>
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
    </SafeContainer>
  );
};

export default PostOnboardingHub;
