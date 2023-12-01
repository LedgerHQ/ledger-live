import React, { useCallback, useEffect, useRef } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Video from "react-native-video";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";
import { useTheme } from "styled-components/native";

import { NavigatorName, ScreenName } from "~/const";
import { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import { BaseComposite, RootNavigation } from "~/components/RootNavigator/types/helpers";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import videoSources from "../../../assets/videos";

const sourceLight = videoSources.onboardingSuccessStaxLight;
const sourceDark = videoSources.onboardingSuccessStaxDark;

const redirectDelay = 5000;

const absoluteStyle = {
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  top: 0,
  right: 0,
};

type Props = BaseComposite<
  StackScreenProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingCompletion>
>;

const CompletionScreen = ({ navigation, route }: Props) => {
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { device } = route.params;
  const startPostOnboarding = useStartPostOnboardingCallback();
  const videoMounted = !useIsAppInBackground();
  const { theme } = useTheme();

  const videoSource = theme === "light" ? sourceLight : sourceDark;

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
      <Flex width="100%" height="100%" alignItems="center" justifyContent="center">
        {videoMounted && (
          <Video
            disableFocus
            source={videoSource}
            style={absoluteStyle}
            muted
            repeat
            resizeMode={"cover"}
          />
        )}
      </Flex>
    </TouchableWithoutFeedback>
  );
};

export default CompletionScreen;
