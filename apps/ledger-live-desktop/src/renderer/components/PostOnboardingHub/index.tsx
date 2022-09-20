import React, { useEffect, useCallback } from "react";
import { Flex, Text, Box } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  useAllPostOnboardingActionsCompleted,
  usePostOnboardingHubState,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import {
  clearPostOnboardingLastActionCompleted,
  setPostOnboardingActionCompleted,
} from "@ledgerhq/live-common/postOnboarding/actions";

import PostOnboardingActionRow from "./PostOnboardingActionRow";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const { actionCompletedHubTitle, actionCompletedPopupLabel } = lastActionCompleted ?? {};

  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

  const completeAction = useCallback(
    id => dispatch(setPostOnboardingActionCompleted({ actionId: id })),
    [dispatch],
  );
  console.log("here", actionsState);
  return (
    <Flex flexDirection="column" justifyContent="center">
      {actionsState.map((action, index, arr) => (
        <React.Fragment key={index}>
          <Box onClick={() => completeAction(action.id)}>
            <PostOnboardingActionRow {...action} />
          </Box>
        </React.Fragment>
      ))}
    </Flex>
  );
};

export default PostOnboardingHub;
// {index !== arr.length - 1 && <Divider />}
