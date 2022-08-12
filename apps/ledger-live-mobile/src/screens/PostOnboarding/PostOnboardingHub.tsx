import React, { useCallback, useEffect, useState } from "react";
import { Box, Flex, Icons, Log, Notification, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  useClearLastActionCompletedCallback,
  usePostOnboardingHubState,
} from "../../logic/postOnboarding/hooks";
import PostOnboardingActionRow from "../../components/PostOnboarding/PostOnboardingActionRow";
import { NavigatorName, ScreenName } from "../../const";

const SafeContainer = styled(SafeAreaView).attrs({
  edges: ["left", "bottom", "right"],
})`
  flex: 1;
`;

const Divider = styled(Box).attrs({
  height: 0.5,
  backgroundColor: "neutral.c30",
  width: "100%",
})``;

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

const PostOnboardingHub: React.FC<{}> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const [popupOpened, setPopupOpened] = useState(true);
  const { actionCompletedHubTitle, actionCompletedPopupLabel } =
    lastActionCompleted ?? {};

  const clearLastActionCompleted = useClearLastActionCompletedCallback();

  useEffect(
    () => () => {
      /**
       * the last action context (specific title & popup) should only be visible
       * the 1st time the hub is navigated to after that action was completed.
       * */
      clearLastActionCompleted();
    },
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

  const navigateToWallet = useCallback(() => {
    navigation.navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
  }, [navigation]);

  const handleClosePopup = useCallback(() => {
    setPopupOpened(false);
  }, [setPopupOpened]);

  const animDoneValue = useSharedValue(0);

  const allDone = actionsState.every(action => action.completed);

  const triggerEndAnimation = useCallback(() => {
    let dead = false;
    let timeout: NodeJS.Timeout;
    const onAnimEnd = () => {
      timeout = setTimeout(() => {
        navigateToWallet();
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
  }, [navigateToWallet, animDoneValue]);

  useFocusEffect(
    useCallback(() => {
      if (allDone) triggerEndAnimation();
    }, [allDone, triggerEndAnimation]),
  );

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
        <Text variant="h1Inter" fontWeight="semiBold" mb="34px">
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
            <>
              <PostOnboardingActionRow key={index} {...action} />
              {index !== arr.length - 1 && <Divider />}
            </>
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
              onPress={navigateToWallet}
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
