import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { Flex, Text } from "@ledgerhq/native-ui";

type Conversation = {
  name: string;
  id: number;
  messages: unknown[];
};

interface ListRowProps {
  item: Conversation;
  index: number;
}

function ConversationRowItem({ item, index }: ListRowProps) {
  const { name } = item;

  return (
    <Flex
      height={72}
      flexDirection="row"
      justifyContent="flex-start"
      alignItems="center"
      py="16px"
      key={index}
    >
      <Flex mx="4" flexDirection="column" justifyContent="center" alignItems="flex-start" flex={1}>
        <Text variant="large" fontWeight="semiBold" numberOfLines={1} testID="market-row-title">
          {`${name}`}
        </Text>
      </Flex>
    </Flex>
  );
}

function ListRow({ item, index }: ListRowProps) {
  const navigation = useNavigation();
  console.log(item);
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate(ScreenName.Conversation, {
          conversationId: item.id,
        });
      }}
    >
      <ConversationRowItem item={item} index={index} />
    </TouchableOpacity>
  );
}

export default ListRow;
