import React, { useMemo, useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { hubStateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { setKey } from "~/renderer/storage";

import PostOnboardingActionRow from "./PostOnboardingActionRow";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHub = () => {
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const postOnboardingState = useSelector(hubStateSelector);

  useEffect(() => {
    setKey("app", "postOnboarding", postOnboardingState);
  }, [postOnboardingState]);

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
