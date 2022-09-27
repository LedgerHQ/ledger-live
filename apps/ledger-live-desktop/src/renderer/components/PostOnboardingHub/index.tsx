import React, { useCallback } from "react";
import { Flex, Box } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";

import PostOnboardingActionRow from "./PostOnboardingActionRow";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const history = useHistory();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);
  const isInsidePostOnboardingScreen = history.location.pathname === "/post-onboarding";

  const handleStartAction = useCallback(action => {
    action.startAction();
  }, []);

  return (
    <Flex flexDirection="column" justifyContent="center">
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
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHub);
