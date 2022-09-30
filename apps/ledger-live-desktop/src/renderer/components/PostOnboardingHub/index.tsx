import React, { useCallback, useMemo } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch } from "react-redux";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";

import PostOnboardingActionRow from "./PostOnboardingActionRow";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

  return (
    <Flex flexDirection="column" justifyContent="center">
      {useMemo(
        () =>
          actionsState.map((action, index, arr) => (
            <React.Fragment key={index}>
              <PostOnboardingActionRow {...action} />
            </React.Fragment>
          )),
        [actionsState],
      )}
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHub);
