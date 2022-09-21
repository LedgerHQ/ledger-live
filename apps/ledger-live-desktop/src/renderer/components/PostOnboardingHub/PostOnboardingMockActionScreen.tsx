import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { setPostOnboardingActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { getPostOnboardingAction } from "./Logic";

const PostOnboardingMockActionScreen = props => {
  // eslint-disable-next-line react/prop-types
  const { id } = props.location.state;
  const dispatch = useDispatch();
  const history = useHistory();
  const action = getPostOnboardingAction(id);
  console.log(action);
  const completeAction = useCallback(
    () => dispatch(setPostOnboardingActionCompleted({ actionId: id })),
    [dispatch, id],
  );

  const navigateToDashboard = useCallback(() => {
    history.push("/");
  }, [history]);

  const navigateToHub = useCallback(() => {
    history.push("/post-onboarding");
  }, [history]);

  const handleCompleteAndGoToDashboard = useCallback(() => {
    completeAction();
    navigateToDashboard();
  }, [completeAction, navigateToDashboard]);

  const handleCompleteAndGoToHub = useCallback(() => {
    completeAction();
    navigateToHub();
  }, [completeAction, navigateToHub]);

  return (
    <Flex p={6} flexDirection="column" height="100%" justifyContent="center" alignItems="center">
      <Text>
        This is a mock screen for the post onboarding action:
        <Text fontWeight="bold">{action?.id}</Text>
      </Text>
      <Button mt={6} variant="main" onClick={handleCompleteAndGoToDashboard}>
        Complete action & go to Wallet
      </Button>
      <Button mt={6} variant="main" onClick={handleCompleteAndGoToHub}>
        Complete action & go back to onboarding hub
      </Button>
    </Flex>
  );
};

export default PostOnboardingMockActionScreen;
