import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";

import {
  useNavigateToPostOnboardingHubCallback,
  useSetActionCompletedCallback,
} from "../../logic/postOnboarding/hooks";
import { postOnboardingActions } from "../../logic/postOnboarding";
import { NavigatorName, ScreenName } from "../../const";
import { ParamList } from "./types";

const PostOnboardingMockActionScreen: React.FC<StackScreenProps<
  ParamList,
  "PostOnboardingMockActionScreen"
>> = ({ navigation, route }) => {
  const { params } = route;
  const { id } = params;
  const setActionCompleted = useSetActionCompletedCallback();
  const navigateToHub = useNavigateToPostOnboardingHubCallback();

  const action = postOnboardingActions[id];

  const completeAction = useCallback(() => {
    setActionCompleted(id);
  }, [setActionCompleted, id]);

  const navigateToWallet = useCallback(() => {
    navigation.navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
  }, [navigation]);

  const handleCompleteAndGoToWallet = useCallback(() => {
    completeAction();
    navigateToWallet();
  }, [completeAction, navigateToWallet]);

  const handleCompleteAndGoToHub = useCallback(() => {
    completeAction();
    navigateToHub();
  }, [completeAction, navigateToHub]);

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
