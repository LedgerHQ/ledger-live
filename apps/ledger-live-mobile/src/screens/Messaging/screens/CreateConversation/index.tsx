import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
interface ViewProps {
  conversation: any;
}

function Conversation({ conversation }: ViewProps) {
  const { colors } = useTheme();
  console.log(conversation);
  return (
    <WalletTabSafeAreaView edges={["left", "right"]}>
      <Flex backgroundColor={colors.background.main}>
        <Text variant="h4" fontWeight="semiBold" color="neutral.c100">
          Your Conversation
        </Text>
      </Flex>
    </WalletTabSafeAreaView>
  );
}

export default Conversation;
