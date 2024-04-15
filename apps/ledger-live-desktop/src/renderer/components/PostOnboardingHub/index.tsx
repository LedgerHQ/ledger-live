import React, { useMemo } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingActionRow from "./PostOnboardingActionRow";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHub = () => {
  const { actionsState, deviceModelId } = usePostOnboardingHubState();

  const postOnboardingRows = useMemo(
    () =>
      actionsState.map((action, index) => (
        <React.Fragment key={index}>
          <PostOnboardingActionRow {...action} deviceModelId={deviceModelId} />
        </React.Fragment>
      )),
    [actionsState, deviceModelId],
  );

  return (
    <Flex flexDirection="column" justifyContent="center">
      {postOnboardingRows}
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHub);
