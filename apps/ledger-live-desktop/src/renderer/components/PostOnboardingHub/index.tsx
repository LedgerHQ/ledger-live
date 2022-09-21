import React, { useEffect, useCallback } from "react";
import { Flex, Button, Box, Text } from "@ledgerhq/react-ui";
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

type Props = {
  isInsideDrawer?: boolean;
  onClose?: () => void;
};

const PostOnboardingHub = ({ isInsideDrawer, onClose }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const history = useHistory();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const { actionCompletedHubTitle, actionCompletedPopupLabel } = lastActionCompleted ?? {};
  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

  const goToMockActionScreen = useCallback(
    id =>
      history.push({
        pathname: "/post-onboarding-mock-action-screen",
        state: { id: id },
      }),
    [history],
  );

  return (
    <Flex flexDirection="column" justifyContent="center" height="100%">
      {isInsideDrawer && (
        <>
          <Text variant="paragraph" fontSize="48px">
            {"Nice one."}
          </Text>
          <Text variant="paragraph" fontSize="48px" mb="25px">
            {"You're all set."}
          </Text>
        </>
      )}
      <Text variant="paragraph" color="neutral.c70">
        {"Here's what you can do next:"}
      </Text>
      {actionsState.map((action, index, arr) => (
        <React.Fragment key={index}>
          <Box onClick={() => goToMockActionScreen(action.id)}>
            <PostOnboardingActionRow {...action} />
          </Box>
        </React.Fragment>
      ))}

      <Button
        onClick={() => (isInsideDrawer && onClose ? onClose() : history.push("/"))}
        color="primary.c80"
      >
        {isInsideDrawer ? "Skip to the app" : "I'll do this later"}
      </Button>
    </Flex>
  );
};

export default PostOnboardingHub;
// {index !== arr.length - 1 && <Divider />}
