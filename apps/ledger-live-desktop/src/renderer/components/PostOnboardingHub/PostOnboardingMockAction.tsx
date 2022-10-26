import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import {
  setPostOnboardingActionCompleted,
  clearPostOnboardingLastActionCompleted,
} from "@ledgerhq/live-common/postOnboarding/actions";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

import { getPostOnboardingAction } from "./logic";
import { setDrawer } from "~/renderer/drawers/Provider";
import useOpenPostOnboardingDrawerCallback from "~/renderer/hooks/useOpenPostOnboardingDrawerCallback";

type Props = {
  id: PostOnboardingActionId;
};

const PostOnboardingMockAction = ({ id }: Props) => {
  const dispatch = useDispatch();
  const action = getPostOnboardingAction(id);
  const openPostOnboardingHubDrawer = useOpenPostOnboardingDrawerCallback();

  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

  const completeAction = useCallback(
    () => dispatch(setPostOnboardingActionCompleted({ actionId: id })),
    [dispatch, id],
  );

  const handleCompleteAndGoToDashboard = useCallback(() => {
    completeAction();
    setDrawer();
    clearLastActionCompleted();
  }, [clearLastActionCompleted, completeAction]);

  const handleCompleteAndGoToHub = useCallback(() => {
    completeAction();
    setDrawer();
    openPostOnboardingHubDrawer();
  }, [completeAction, openPostOnboardingHubDrawer]);

  return (
    <Flex p={6} flexDirection="column" height="100%" justifyContent="center" alignItems="center">
      <Text>
        This is a mock screen for the post onboarding action:
        <Text fontWeight="bold">{action?.id}</Text>
      </Text>
      <Button
        mt={6}
        variant="main"
        onClick={handleCompleteAndGoToDashboard}
        data-test-id={"postonboarding-go-to-dashboard-button"}
      >
        Complete action & go to Wallet
      </Button>
      <Button
        mt={6}
        variant="main"
        onClick={handleCompleteAndGoToHub}
        data-test-id={"postonboarding-go-to-hub-button"}
      >
        Complete action & go back to onboarding hub
      </Button>
    </Flex>
  );
};

export default PostOnboardingMockAction;
