import React, { useCallback, useEffect, useRef } from "react";
import { Box, Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import { NavigatorName, ScreenName } from "~/const";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import { BaseComposite, RootNavigation } from "~/components/RootNavigator/types/helpers";
import { DeviceModelId } from "@ledgerhq/devices";
import EuropaCompletionView from "./EuropaCompletionView";
import StaxCompletionView from "./StaxCompletionView";
import { useDispatch, useSelector } from "react-redux";
import {
  setHasBeenRedirectedToPostOnboarding,
  setHasBeenUpsoldProtect,
  setIsReborn,
  setOnboardingHasDevice,
} from "~/actions/settings";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { useIsFocused, useNavigation } from "@react-navigation/core";
import Button from "~/components/Button";
import styled from "styled-components/native";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import Svg, { LinearGradient, Text, Defs, Stop, TSpan } from "react-native-svg";

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

const A_B_TEST_FLAG = true;

const CompletionScreen = ({ route }: Props) => {
  const { dark } = useTheme();
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const navigation = useNavigation<RootNavigation>();
  const dispatch = useDispatch();

  const preventNavigation = useRef(true);

  const { device } = route.params;

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

  useEffect(
    () =>
      navigation.addListener("beforeRemove", e => {
        if (A_B_TEST_FLAG && preventNavigation.current) e.preventDefault();
      }),
    [navigation],
  );

  if (A_B_TEST_FLAG) {
    return (
      <Flex
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
        backgroundColor="red"
      >
        {device.modelId === DeviceModelId.europa ? (
          <EuropaCompletionView device={device} loop />
        ) : (
          <StaxCompletionView />
        )}
        <CTAWrapper>
          <Flex flex={1} alignItems="center" mb={57}>
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
          </Flex>
          <Button
            event="CompletionScreenContinue"
            containerStyle={styles.confirmationButton}
            type={"secondary"}
            title={<Trans i18nKey="common.close" />}
            testID="completion-screen-continue-button"
            onPress={redirectToMainScreen}
          />
        </CTAWrapper>
      </Flex>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={redirectToMainScreen}>
      <Flex
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
        backgroundColor="blue"
      >
        {device.modelId === DeviceModelId.europa ? (
          <EuropaCompletionView
            device={device}
            onAnimationFinish={redirectToMainScreen}
            loop={false}
          />
        ) : (
          <StaxCompletionView onAnimationFinish={redirectToMainScreen} />
        )}
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
