import React, { useCallback, useMemo, useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "react-redux";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { hubStateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { setKey } from "~/renderer/storage";

import PostOnboardingActionRow from "./PostOnboardingActionRow";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const postOnboardingState = useSelector(hubStateSelector);
  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);

  useEffect(() => {
    setKey("app", "postOnboarding", postOnboardingState);
  }, [postOnboardingState]);

  useEffect(() => {
    console.log("mount up");
    return () => {
      console.log("cleaned up");
      //clearLastActionCompleted();
    };
  }, []);

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
