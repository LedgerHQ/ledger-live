import React, { useEffect } from "react";
import { NavigatorName, ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PostOnboardingNavigatorParamList } from "~/components/RootNavigator/types/PostOnboardingNavigator";
import { usePostOnboardingDeeplinkHandler } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import { Loading } from "~/components/Loading";

type Props = BaseComposite<
  StackNavigatorProps<PostOnboardingNavigatorParamList, ScreenName.PostOnboardingDeeplinkHandler>
>;
const PostOnboardingDeeplinkHandler = ({ route, navigation }: Props) => {
  const navigateToHome = () => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  };
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const postOnboardingDeeplinkHandler = usePostOnboardingDeeplinkHandler(
    navigateToHome,
    navigateToPostOnboardingHub,
  );

  useEffect(() => {
    postOnboardingDeeplinkHandler(route.params?.device);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Loading />;
};

export default PostOnboardingDeeplinkHandler;
