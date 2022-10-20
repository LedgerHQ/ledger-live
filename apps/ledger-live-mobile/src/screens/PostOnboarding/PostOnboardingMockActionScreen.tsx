import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";

import { getPostOnboardingAction } from "../../logic/postOnboarding";
import { NavigatorName, ScreenName } from "../../const";
import { ParamList } from "./types";
import { useNavigateToPostOnboardingHubCallback } from "../../logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import { useCompleteActionCallback } from "../../logic/postOnboarding/useCompleteAction";

const PostOnboardingMockActionScreen: React.FC<
  StackScreenProps<ParamList, "PostOnboardingMockActionScreen">
> = ({ navigation, route }) => {
  const { params } = route;
  const { id } = params;
  const navigateToHub = useNavigateToPostOnboardingHubCallback();

  const action = getPostOnboardingAction(id);

  const completeAction = useCompleteActionCallback();

  const complete = useCallback(() => {
    completeAction(id);
  }, [completeAction, id]);

  const navigateToWallet = useCallback(() => {
    navigation.navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
  }, [navigation]);

  const handleCompleteAndGoToWallet = useCallback(() => {
    complete();
    navigateToWallet();
  }, [complete, navigateToWallet]);

  const handleCompleteAndGoToHub = useCallback(() => {
    complete();
    navigateToHub();
  }, [complete, navigateToHub]);

  return (
    <Flex p={6}>
      <Text>
        This is a mock screen for the post onboarding action:{"\n"}
        <Text fontWeight="bold">{action?.id}</Text>
      </Text>
      <Button mt={6} type="main" onPress={handleCompleteAndGoToWallet}>
        Complete action & go to Wallet
      </Button>
      <Button mt={6} type="main" onPress={handleCompleteAndGoToHub}>
        Complete action & go back to onboarding hub
      </Button>
    </Flex>
  );
};

export default PostOnboardingMockActionScreen;
