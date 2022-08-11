import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";

import {
  useNavigateToPostOnboardingHubCallback,
  useSetActionDoneCallback,
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
  const setActionDone = useSetActionDoneCallback();
  const navigateToHub = useNavigateToPostOnboardingHubCallback();

  const action = postOnboardingActions[id];

  const finishAction = useCallback(() => {
    setActionDone(id);
  }, [setActionDone, id]);

  const navigateToWallet = useCallback(() => {
    navigation.navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
  }, [navigation]);

  const handleFinishAndGoToWallet = useCallback(() => {
    finishAction();
    navigateToWallet();
  }, [finishAction, navigateToWallet]);

  const handleFinishAndGoToHub = useCallback(() => {
    finishAction();
    navigateToHub();
  }, [finishAction, navigateToHub]);

  return (
    <Flex>
      <Text>action: {action?.id}</Text>
      <Button type="main" onPress={handleFinishAndGoToWallet}>
        Finish action & go to Wallet
      </Button>
      <Button type="main" onPress={handleFinishAndGoToHub}>
        Finish action & go back to onboarding hub
      </Button>
    </Flex>
  );
};

export default PostOnboardingMockActionScreen;
