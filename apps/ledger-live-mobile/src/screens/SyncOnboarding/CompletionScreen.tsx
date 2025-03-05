import React, { useCallback, useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
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

type Props = BaseComposite<
  StackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompletion>
>;

const CompletionScreen = ({ navigation, route }: Props) => {
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

  const hasRedirected = React.useRef(false);

  const redirectToMainScreen = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    (navigation as unknown as RootNavigation).reset({
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
  }, [navigation]);

  return (
    <TouchableWithoutFeedback onPress={redirectToMainScreen}>
      <Flex width="100%" height="100%" alignItems="center" justifyContent="center">
        {device.modelId === DeviceModelId.europa ? (
          <EuropaCompletionView device={device} onAnimationFinish={redirectToMainScreen} />
        ) : (
          <StaxCompletionView onAnimationFinish={redirectToMainScreen} />
        )}
      </Flex>
    </TouchableWithoutFeedback>
  );
};

export default CompletionScreen;
