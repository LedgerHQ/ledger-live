import React, { useCallback, useEffect, useRef } from "react";
import { Box, Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import { NavigatorName, ScreenName } from "~/const";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import { BaseComposite, RootNavigation } from "~/components/RootNavigator/types/helpers";
import { DeviceModelId } from "@ledgerhq/devices";
import EuropaCompletionView from "./EuropaCompletionView";
import StaxOnboardingSuccessView from "./StaxOnboardingSuccessView";
import ApexOnboardingSuccessView from "./ApexOnboardingSuccessView";
import { useDispatch, useSelector } from "react-redux";
import {
  setHasBeenRedirectedToPostOnboarding,
  setHasBeenUpsoldProtect,
  setIsOnboardingFlow,
  setIsReborn,
  setOnboardingHasDevice,
} from "~/actions/settings";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { useIsFocused, useNavigation } from "@react-navigation/core";
import Button from "~/components/Button";
import styled from "styled-components/native";
import { StyleSheet } from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
// import { useTheme } from "@react-navigation/native";
import {
  Trans,
  /*useTranslation */
} from "react-i18next";
import { TrackScreen, track } from "~/analytics";
import {
  useModularDrawerController,
  useModularDrawerVisibility,
  ModularDrawerLocation,
} from "LLM/features/ModularDrawer";
// import Svg, { LinearGradient, Text, Defs, Stop, TSpan } from "react-native-svg";

const CTAWrapper = styled(Box)`
  position: absolute;
  display: flex;
  width: 100%;
  bottom: 22px;
  padding-left: 16px;
  padding-right: 16px;
  margin-bottom: 22px;
  justify-items: end;
  text-align: center;
`;

type Props = BaseComposite<
  StackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompletion>
>;

const CompletionScreen = ({ route }: Props) => {
  // const { dark } = useTheme();
  // const { t } = useTranslation();
  const isFocused = useIsFocused();
  const navigation = useNavigation<RootNavigation>();
  const dispatch = useDispatch();
  const isSyncIncr1Enabled = useFeature("llmSyncOnboardingIncr1")?.enabled || false;
  const { isOpen: isModularDrawerOpen } = useModularDrawerController();
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });

  const isModularDrawerEnabled = isModularDrawerVisible({
    location: ModularDrawerLocation.RECEIVE_FLOW,
  });

  const preventNavigation = useRef(true);

  const { device, seedConfiguration } = route.params;

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const redirectToMainScreen = useCallback(() => {
    if (!isFocused) return;
    preventNavigation.current = false;

    navigation.reset({
      index: 0,
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            routes: [
              {
                name: NavigatorName.Main,
              },
            ],
          },
        },
      ],
    });
  }, [isFocused, navigation]);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      dispatch(setOnboardingHasDevice(true));
    }
    dispatch(setIsReborn(false));
    dispatch(setHasBeenUpsoldProtect(false));
    dispatch(setHasBeenRedirectedToPostOnboarding(false));
  }, [dispatch, hasCompletedOnboarding]);

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsOnboardingFlow(false));
    }
  }, [dispatch, isFocused]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", e => {
        if (isSyncIncr1Enabled && preventNavigation.current) e.preventDefault();
      }),
    [navigation, isSyncIncr1Enabled],
  );

  const onboardingSuccessView = (loop: boolean, redirectToMainScreen?: () => void) => {
    switch (device.modelId) {
      case DeviceModelId.europa:
        return <EuropaCompletionView onAnimationFinish={redirectToMainScreen} loop={loop} />;
      case DeviceModelId.stax:
        return <StaxOnboardingSuccessView onAnimationFinish={redirectToMainScreen} />;
      case DeviceModelId.apex:
        return <ApexOnboardingSuccessView onAnimationFinish={redirectToMainScreen} />;
      default:
        return null;
    }
  };

  if (isSyncIncr1Enabled) {
    return (
      <Flex width="100%" height="100%" alignItems="center" justifyContent="center">
        <TrackScreen
          category="End of onboarding"
          flow="onboarding"
          seedConfiguration={seedConfiguration}
        />
        {/* If the modular drawer is enabled and open, we don't want to show the onboarding success view */}
        {!(isModularDrawerEnabled && isModularDrawerOpen) && onboardingSuccessView(true)}
        <CTAWrapper>
          {/*  <Flex flex={1} alignItems="center" mb={57}>
            <Svg height="30" width="225">
              <Defs>
                {dark ? (
                  <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0.3059" stopColor="#fff" stopOpacity="1" />
                    <Stop offset="0.7223" stopColor="#a6a6a6" stopOpacity="1" />
                  </LinearGradient>
                ) : (
                  <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0.3059" stopColor="#000" stopOpacity="1" />
                    <Stop offset="0.7223" stopColor="#636363" stopOpacity="1" />
                  </LinearGradient>
                )}
              </Defs>
              <Text fill="url(#grad)">
                <TSpan fontSize="24" x="0" y="20">
                  {t("onboarding.completionScreen.title")}
                </TSpan>
              </Text>
            </Svg>
              </Flex> */}
          <Button
            event="CompletionScreenContinue"
            containerStyle={styles.confirmationButton}
            type={"secondary"}
            title={<Trans i18nKey="common.continue" />}
            testID="completion-screen-continue-button"
            onPress={() => {
              track("button_clicked", {
                button: "Finish onboarding",
                flow: "onboarding",
                seedConfiguration,
              });
              redirectToMainScreen();
            }}
          />
        </CTAWrapper>
      </Flex>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={redirectToMainScreen}>
      <Flex width="100%" height="100%" alignItems="center" justifyContent="center">
        <TrackScreen
          category="End of onboarding"
          flow="onboarding"
          seedConfiguration={seedConfiguration}
        />
        {onboardingSuccessView(false, redirectToMainScreen)}
      </Flex>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  confirmationButton: {
    flexGrow: 1,
  },
});

export default CompletionScreen;
