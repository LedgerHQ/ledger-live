import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, FlatList, TextInput } from "react-native";
import { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { Flex, ScrollContainerHeader, Button, Text } from "@ledgerhq/native-ui";
import BackButton from "./components/BackButton";
import useConversation from "../../hooks/useConversation";

interface ViewProps {
  route: { params: { conversationId: number } };
}

const Conversation: React.FC<ViewProps> = ({ route }) => {
  const { colors } = useTheme();
  const { params } = route;
  const { getConversation, sendMessage } = useConversation(); // assume sendMessage is provided
  const conversation = getConversation(params.conversationId);
  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessage(params.conversationId, messageText);
      setMessageText("");
    }
  };

  // Render each message; adjust styling based on author if needed.
  const renderItem = ({
    item,
  }: {
    item: { message: string; author: string; text: string; date: string };
  }) => (
    <Flex
      p={3}
      mb={2}
      backgroundColor={item.author === "me" ? colors.primary.light : colors.background.paper}
      alignSelf={item.author === "me" ? "flex-end" : "flex-start"}
      borderRadius="8px"
    >
      <Text>{item.message}</Text>
      <Text variant="small" color="neutral.c80" mt={1}>
        {new Date(item.date).toLocaleTimeString()}
      </Text>
    </Flex>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} isFlex>
      <ScrollContainerHeader
        TopLeftSection={<BackButton />}
        MiddleSection={<></>}
        TopRightSection={<></>}
        BottomSection={<></>}
      >
        <Flex flex={1} backgroundColor={colors.background.main}>
          <FlatList
            data={conversation?.messages || []}
            keyExtractor={item => item.date}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
            inverted // Show most recent messages at the bottom
          />
        </Flex>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <Flex
            p={3}
            direction="row"
            alignItems="center"
            backgroundColor={colors.background.main}
            borderTopWidth={1}
            borderColor={colors.divider}
          >
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: 8,
                backgroundColor: colors.background.paper,
                borderRadius: 8,
                marginRight: 8,
                color: colors.text.primary,
              }}
              placeholderTextColor={colors.text.secondary}
            />
            <Button onPress={handleSend} variant="primary">
              Send
            </Button>
          </Flex>
        </KeyboardAvoidingView>
      </ScrollContainerHeader>
    </SafeAreaView>
  );
};

export default Conversation;
