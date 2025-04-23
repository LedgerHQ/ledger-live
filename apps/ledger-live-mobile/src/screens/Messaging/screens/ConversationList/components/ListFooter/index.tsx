import React from "react";
import { ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/native";
import { Flex, InfiniteLoader, Button } from "@ledgerhq/native-ui";

interface ListFooterProps {
  isLoading: boolean;
}

function ListFooter({ isLoading }: ListFooterProps) {
  const navigation = useNavigation();
  const onNewConversation = () => {
    navigation.navigate(ScreenName.CreateConversation, {});
  };
  const onJoinConversation = () => {
    navigation.navigate(ScreenName.JoinConversation, {});
  };
  return (
    <Flex height={40} mb={6}>
      {isLoading ? <InfiniteLoader size={30} /> : null}
      <Flex p="16px" mt="16px" alignItems="center">
        <Button onPress={onNewConversation} type="main" style={{ width: "100%" }}>
          Start a New Conversation
        </Button>
        <Button onPress={onJoinConversation} type="default" mt={4} style={{ width: "100%" }}>
          Join a Conversation
        </Button>
      </Flex>
    </Flex>
  );
}

export default ListFooter;
