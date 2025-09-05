import React, { useCallback, useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
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
  setIsReborn,
  setOnboardingHasDevice,
} from "~/actions/settings";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { useIsFocused, useNavigation } from "@react-navigation/core";

type Props = BaseComposite<
  StackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompletion>
>;

const CompletionScreen = ({ route }: Props) => {
  const navigation = useNavigation<RootNavigation>();
  const { device } = route.params;
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      dispatch(setOnboardingHasDevice(true));
    }
    dispatch(setIsReborn(false));
    dispatch(setHasBeenUpsoldProtect(false));
    dispatch(setHasBeenRedirectedToPostOnboarding(false));
  }, [dispatch, hasCompletedOnboarding]);

  const isFocused = useIsFocused();

  const redirectToMainScreen = useCallback(() => {
    if (!isFocused) return;
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

  const onboardingSuccessView = () => {
    switch (device.modelId) {
      case DeviceModelId.europa:
        return <EuropaCompletionView onAnimationFinish={redirectToMainScreen} />;
      case DeviceModelId.stax:
        return <StaxOnboardingSuccessView onAnimationFinish={redirectToMainScreen} />;
      case DeviceModelId.apex:
        return <ApexOnboardingSuccessView onAnimationFinish={redirectToMainScreen} />;
      default:
        return null;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={redirectToMainScreen}>
      <Flex width="100%" height="100%" alignItems="center" justifyContent="center">
        {onboardingSuccessView()}
      </Flex>
    </TouchableWithoutFeedback>
  );
};

export default CompletionScreen;
