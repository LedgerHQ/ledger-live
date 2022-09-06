import React, { useEffect } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import PostOnboarding from "~/renderer/components/PostOnboarding";

const PostOnboardingScreen = () => {
  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <PostOnboarding />
    </Flex>
  );
};

export default PostOnboardingScreen;
