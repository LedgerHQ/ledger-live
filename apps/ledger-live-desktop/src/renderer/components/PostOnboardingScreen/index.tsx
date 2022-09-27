import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import PostOnboardingHubContent from "~/renderer/components/PostOnboardingHub/PostOnboardingHubContent";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingScreen = () => {
  return (
    <Flex flexDirection="row" width="100%" height="100%">
      <Flex
        justifyContent="center"
        flex={1}
        flexDirection="column"
        paddingLeft={100}
        paddingRight={50}
      >
        <Text variant="paragraph" fontSize={48}>
          {"Nice one."}
        </Text>
        <Text variant="paragraph" fontSize={48} mb={8}>
          {"You're all set."}
        </Text>
        <Text variant="paragraph" fontSize={14} color="neutral.c70" mb={8}>
          {"Cheers for setting up your Nano!"}
        </Text>
        <Text variant="paragraph" fontSize={14} color="neutral.c70" mb={8} maxWidth={450}>
          {
            "We have prepared for you some steps to start with. If you feel like exploring Ledger Live on your own, don't hesitate to skip this step, you can always come back to it."
          }
        </Text>
        <Text variant="paragraph" fontSize={14} color="neutral.c70" mb={8}>
          {"Enjoy your travel into the Web3 securely with Ledger Live."}
        </Text>
      </Flex>
      <Flex flex={1} paddingRight={100} paddingLeft={50}>
        <PostOnboardingHubContent />
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingScreen);
