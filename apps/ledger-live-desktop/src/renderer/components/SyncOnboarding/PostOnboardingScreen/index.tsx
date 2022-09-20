import React, { useEffect } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import PostOnboardingHub from "~/renderer/components/PostOnboardingHub";

const PostOnboardingScreen = () => {
  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <PostOnboardingHub />
    </Flex>
  );
};

export default PostOnboardingScreen;
