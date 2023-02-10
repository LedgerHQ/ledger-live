import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import { setPostOnboardingActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

import { getPostOnboardingAction } from "./logic";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useNavigateToPostOnboardingHubCallback } from "./logic/useNavigateToPostOnboardingHubCallback";

type Props = {
  id: PostOnboardingActionId;
};

const PostOnboardingMockAction = ({ id }: Props) => {
  const dispatch = useDispatch();
  const action = getPostOnboardingAction(id);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();

  const completeAction = useCallback(
    () => dispatch(setPostOnboardingActionCompleted({ actionId: id })),
    [dispatch, id],
  );

  const handleCompleteAndGoToHub = useCallback(() => {
    completeAction();
    setDrawer();
    navigateToPostOnboardingHub();
  }, [completeAction, navigateToPostOnboardingHub]);

  return (
    <Flex p={6} flexDirection="column" height="100%" justifyContent="center" alignItems="center">
      <Text>
        This is a mock screen for the post onboarding action:
        <Text fontWeight="bold">{action?.id}</Text>
      </Text>
      <Button
        mt={6}
        variant="main"
        onClick={handleCompleteAndGoToHub}
        data-test-id={"postonboarding-complete-action-button"}
      >
        Complete action & go back to onboarding hub
      </Button>
    </Flex>
  );
};

export default PostOnboardingMockAction;
