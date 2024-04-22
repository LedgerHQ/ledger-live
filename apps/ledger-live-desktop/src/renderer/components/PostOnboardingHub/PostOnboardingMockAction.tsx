import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { getPostOnboardingAction } from "./logic";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useNavigateToPostOnboardingHubCallback } from "./logic/useNavigateToPostOnboardingHubCallback";
import { useCompleteActionCallback } from "./logic/useCompleteAction";

type Props = {
  id: PostOnboardingActionId;
};

const PostOnboardingMockAction = ({ id }: Props) => {
  const action = getPostOnboardingAction(id);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();

  const completeAction = useCompleteActionCallback();

  const handleCompleteAndGoToHub = useCallback(() => {
    completeAction(id);
    setDrawer();
    navigateToPostOnboardingHub();
  }, [completeAction, navigateToPostOnboardingHub, id]);

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
