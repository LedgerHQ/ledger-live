import React, { useCallback, useEffect, useRef } from "react";
import { Box, Flex } from "@ledgerhq/native-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet } from "react-native";

import { NavigatorName, ScreenName } from "~/const";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import { BaseComposite, RootNavigation } from "~/components/RootNavigator/types/helpers";
import { DeviceModelId } from "@ledgerhq/devices";
import EuropaCompletionView from "./EuropaCompletionView";
import StaxOnboardingSuccessView from "./StaxOnboardingSuccessView";
import ApexOnboardingSuccessView from "./ApexOnboardingSuccessView";
import { useSelector, useDispatch } from "~/context/store";
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
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Trans } from "react-i18next";
import { TrackScreen, track } from "~/analytics";
import { useModularDrawerController } from "LLM/features/ModularDrawer";

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
  NativeStackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompletion>
>;

const CompletionScreen = ({ route }: Props) => {
  // const { dark } = useTheme();
  // const { t } = useTranslation();
  const isFocused = useIsFocused();
  const navigation = useNavigation<RootNavigation>();
  const dispatch = useDispatch();
  const isSyncIncr1Enabled = useFeature("llmSyncOnboardingIncr1")?.enabled || false;
  const { isOpen: isModularDrawerOpen } = useModularDrawerController();

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
        {!isModularDrawerOpen && onboardingSuccessView(true)}
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
    <Pressable onPress={redirectToMainScreen}>
      <Flex width="100%" height="100%" alignItems="center" justifyContent="center">
        <TrackScreen
          category="End of onboarding"
          flow="onboarding"
          seedConfiguration={seedConfiguration}
        />
        {onboardingSuccessView(false, redirectToMainScreen)}
      </Flex>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  confirmationButton: {
    flexGrow: 1,
  },
});

export default CompletionScreen;
