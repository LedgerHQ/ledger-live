import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { Flex, Text } from "@ledgerhq/native-ui";

type Message = {
  text: string;
  date: string;
};

type Conversation = {
  name: string;
  id: string;
  messages: Message[];
};

interface ListRowProps {
  item: Conversation;
  index: number;
}

// Helper function to format the date based on whether it's today or not
const formatMessageDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString();
};

function ConversationRowItem({ item, index }: ListRowProps) {
  // Get the last message if it exists
  const lastMessage = item.messages.length ? item.messages[item.messages.length - 1] : undefined;
  return (
    <Flex
      backgroundColor="background.paper"
      borderRadius="12px"
      p="16px"
      mx="16px"
      my="8px"
      flexDirection="column"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
      key={index}
    >
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text variant="large" fontWeight="semiBold" numberOfLines={1} flexShrink={1}>
          {item.name}
        </Text>
        {lastMessage && (
          <Text variant="small" color="neutral.c80">
            {formatMessageDate(lastMessage.date)}
          </Text>
        )}
      </Flex>
      {/* Second row: last message */}
      {lastMessage && (
        <Text variant="small" color="neutral.c80" mt="4px" numberOfLines={1}>
          {lastMessage.message}
        </Text>
      )}
    </Flex>
  );
}

function ListRow({ item, index }: ListRowProps) {
  const navigation = useNavigation();
  return (
    <>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ScreenName.Conversation, {
            conversationId: item.id,
            name: item.name,
          });
        }}
      >
        <ConversationRowItem item={item} index={index} />
      </TouchableOpacity>
      <Flex height="1px" backgroundColor="neutral.c40" mx="16px" />
    </>
  );
}

export default ListRow;
