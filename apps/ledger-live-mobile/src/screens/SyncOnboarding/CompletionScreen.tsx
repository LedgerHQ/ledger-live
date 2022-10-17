import React, { useCallback, useEffect, useRef } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";

import { NavigatorName } from "../../const";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/BaseNavigator";
import type { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import Illustration from "../../images/illustration/Illustration";
import DeviceDark from "../../images/illustration/Dark/_000_PLACEHOLDER.png";
import DeviceLight from "../../images/illustration/Light/_000_PLACEHOLDER.png";

const redirectDelay = 5000;

type Props = CompositeScreenProps<
  StackScreenProps<SyncOnboardingStackParamList, "SyncOnboardingCompletion">,
  StackScreenProps<BaseNavigatorStackParamList>
>;

const CompletionScreen = ({ navigation, route }: Props) => {
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { device } = route.params;
  const startPostOnboarding = useStartPostOnboardingCallback(device.modelId);

  const redirectToPostOnboarding = useCallback(() => {
    // Resets the navigation stack to avoid allowing to go back to the onboarding welcome screen
    navigation.reset({
      index: 0,
      routes: [
        {
          name: NavigatorName.Base as "Base",
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
    startPostOnboarding();
  }, [navigation, startPostOnboarding]);

  const skipDelay = useCallback(() => {
    if (!delayRef.current) {
      return;
    }
    clearTimeout(delayRef.current);
    delayRef.current = null;
    redirectToPostOnboarding();
  }, [redirectToPostOnboarding]);

  useEffect(() => {
    delayRef.current = setTimeout(redirectToPostOnboarding, redirectDelay);

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [redirectToPostOnboarding]);

  return (
    <TouchableWithoutFeedback onPress={skipDelay}>
      <Flex
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
      >
        <Illustration
          lightSource={DeviceLight}
          darkSource={DeviceDark}
          size={300}
        />
      </Flex>
    </TouchableWithoutFeedback>
  );
};

export default CompletionScreen;
