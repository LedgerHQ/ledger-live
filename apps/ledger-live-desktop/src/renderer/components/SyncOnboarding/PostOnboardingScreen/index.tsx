import React, { useEffect } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import PostOnboardingHub from "~/renderer/components/PostOnboardingHub";

const PostOnboardingScreen = () => {
  return (
    <Flex flexDirection="row" width="100%" height="100%">
      <Flex justifyContent="center" flex={1} flexDirection="column">
        <Text variant="paragraph" fontSize="48px">
          {"Nice one."}
        </Text>
        <Text variant="paragraph" fontSize="48px">
          {"You're all set."}
        </Text>
        <Text variant="paragraph" fontSize="14px" color="neutral.c70">
          {"Cheers for setting up your Nano!"}
        </Text>
        <Text variant="paragraph" fontSize="14px" color="neutral.c70">
          {
            "We have prepared for you some steps to start with. If you feel like exploring Ledger Live on your own, don't hesitate to skip this step, you can always come back to it."
          }
        </Text>
        <Text variant="paragraph" fontSize="14px" color="neutral.c70">
          {"Enjoy your travel into the Web3 securely with Ledger Live."}
        </Text>
      </Flex>
      <Flex flex={1}>
        <PostOnboardingHub />
      </Flex>
    </Flex>
  );
};

export default PostOnboardingScreen;
