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
import { setDrawer } from "~/renderer/drawers/Provider";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const history = useHistory();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const { actionCompletedHubTitle, actionCompletedPopupLabel } = lastActionCompleted ?? {};
  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);
  const isInsidePostOnboardingScreen = history.location.pathname === "/post-onboarding";

  const handleStartAction = useCallback(action => {
    action.startAction();
  }, []);

  return (
    <Flex flexDirection="column" justifyContent="center" height="100%">
      {!isInsidePostOnboardingScreen && (
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
          <Box
            onClick={() => {
              if (action.navigationParams) history.push(...action.navigationParams);
              else if (action.startAction) {
                if (isInsidePostOnboardingScreen) {
                  history.push("/");
                }
                handleStartAction(action);
              }
            }}
          >
            <PostOnboardingActionRow {...action} />
          </Box>
        </React.Fragment>
      ))}

      <Button
        onClick={() => (isInsidePostOnboardingScreen ? history.push("/") : setDrawer())}
        color="primary.c80"
      >
        {isInsidePostOnboardingScreen ? "I'll do this later" : "Skip to the app"}
      </Button>
    </Flex>
  );
};

export default PostOnboardingHub;
// {index !== arr.length - 1 && <Divider />}
