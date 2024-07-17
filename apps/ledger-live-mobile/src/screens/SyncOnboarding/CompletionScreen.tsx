import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";

import { NavigatorName, ScreenName } from "~/const";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import { BaseComposite, RootNavigation } from "~/components/RootNavigator/types/helpers";
import { DeviceModelId } from "@ledgerhq/devices";
import EuropaCompletionView from "./EuropaCompletionView";
import StaxCompletionView from "./StaxCompletionView";

type Props = BaseComposite<
  StackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompletion>
>;

const CompletionScreen = ({ navigation, route }: Props) => {
  const { device } = route.params;
  const startPostOnboarding = useStartPostOnboardingCallback();

  const redirectToPostOnboarding = useCallback(() => {
    startPostOnboarding({
      deviceModelId: device.modelId,
      resetNavigationStack: true,
      fallbackIfNoAction: () =>
        // Resets the navigation stack to avoid allowing to go back to the onboarding welcome screen
        // FIXME: bindings to react-navigation seem to have issues with composites
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
        }),
    });
  }, [device.modelId, navigation, startPostOnboarding]);

  return (
    <TouchableWithoutFeedback onPress={redirectToPostOnboarding}>
      <Flex width="100%" height="100%" alignItems="center" justifyContent="center">
        {device.modelId === DeviceModelId.europa ? (
          <EuropaCompletionView device={device} onAnimationFinish={redirectToPostOnboarding} />
        ) : (
          <StaxCompletionView onAnimationFinish={redirectToPostOnboarding} />
        )}
      </Flex>
    </TouchableWithoutFeedback>
  );
};

export default CompletionScreen;
