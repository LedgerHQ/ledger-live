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

type Props = {
  isInsideDrawer?: boolean;
};

const PostOnboardingHub = ({ isInsideDrawer }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const history = useHistory();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const { actionCompletedHubTitle, actionCompletedPopupLabel } = lastActionCompleted ?? {};
  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

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
          <Box
            onClick={() => {
              console.log("ok", action);
              if (action.navigationParams) history.push(...action.navigationParams);
              else if (action.startAction) action.startAction();
            }}
          >
            <PostOnboardingActionRow {...action} />
          </Box>
        </React.Fragment>
      ))}

      <Button
        onClick={() => (isInsideDrawer ? setDrawer() : history.push("/"))}
        color="primary.c80"
      >
        {isInsideDrawer ? "Skip to the app" : "I'll do this later"}
      </Button>
    </Flex>
  );
};

export default PostOnboardingHub;
// {index !== arr.length - 1 && <Divider />}
