import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePostOnboarding } from "../../logic/postOnboarding/hooks";
import { postOnboardingActions } from "../../logic/postOnboarding";
import { ScreenName } from "../../const";

export default () => {
  const route = useRoute();
  const { params } = route;
  const { id }: { id: PostOnboardingActionId } = params;
  const { setActionDone } = usePostOnboarding();
  const navigation = useNavigation();

  const action = postOnboardingActions[id];

  const finishAction = useCallback(() => {
    setActionDone(id);
  }, [setActionDone, id]);

  const navigateToWallet = useCallback(() => {
    navigation.navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
  }, [navigation]);

  const handleFinishAndClose = useCallback(() => {
    finishAction();
    navigateToWallet();
  }, [finishAction, navigateToWallet]);

  return (
    <Flex>
      <Text>action: {action?.id}</Text>
      <Button type="main" onPress={handleFinishAndClose}>
        Finish action & go to Wallet
      </Button>
      <Button type="main">Finish action & go back to onboarding hub</Button>
    </Flex>
  );
};
