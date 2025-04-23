import React, { useState, useRef } from "react";
import { KeyboardAvoidingView, Platform, FlatList, TextInput } from "react-native";
import { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { Flex, ScrollContainerHeader, Button, Text } from "@ledgerhq/native-ui";
import BackButton from "./components/BackButton";
import useConversation from "../../hooks/useConversation";

interface ViewProps {
  route: { params: { conversationId: string } };
}

const Conversation: React.FC<ViewProps> = ({ route }) => {
  const { colors } = useTheme();
  const { params } = route;
  const flatListRef = useRef<FlatList>(null);
  const { getConversation, sendMessage } = useConversation();
  const conversation = getConversation(params.conversationId);
  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessage(params.conversationId, messageText);
      setMessageText("");
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Render each message bubble
  const renderItem = ({
    item,
  }: {
    item: { message: string; author: string; text: string; date: string };
  }) => (
    <Flex
      p={3}
      mb={4}
      backgroundColor={item.author === "Alice" ? colors.primary.c20 : colors.background.default}
      alignSelf={item.author === "Alice" ? "flex-end" : "flex-start"}
      borderRadius="16px"
      maxWidth="80%"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2, // Android-specific shadow
      }}
    >
      <Text color={item.author === "Alice" ? colors.primary.c100 : colors.neutral.c100}>
        {item.message}
      </Text>
      <Text variant="small" color="neutral.c80" mt={1} textAlign="right">
        {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </Flex>
  );

  return (
    <SafeAreaView edges={["top"]} isFlex style={{ marginHorizontal: 8 }}>
      <ScrollContainerHeader
        TopLeftSection={
          <Flex height={48} flexDirection="row" alignItems="center">
            <BackButton />
            <Text ml={3} variant="large" fontSize={22} fontWeight="semiBold">
              {conversation.name}
            </Text>
          </Flex>
        }
        MiddleSection={<></>}
        TopRightSection={<></>}
        BottomSection={<></>}
      >
        <Flex flex={1} backgroundColor={colors.background.main}>
          <FlatList
            ref={flatListRef} // Attach the ref to the FlatList
            data={conversation?.messages || []}
            keyExtractor={item => item.date}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
            inverted // Show most recent messages at the bottom
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })} // Scroll to the bottom when content changes
          />
        </Flex>
      </ScrollContainerHeader>
      <Flex justifyContent="flex-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <Flex
            p={3}
            alignItems="center"
            justifyContent="flex-end"
            backgroundColor={colors.background.main}
            borderTopWidth={1}
            borderColor={colors.neutral.c40}
          >
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              style={{
                padding: 12,
                width: "100%",
                marginBottom: 10,
                backgroundColor: colors.background.default,
                borderRadius: 24,
                marginRight: 8,
                color: colors.neutral.c100,
                fontSize: 16,
              }}
              placeholderTextColor={colors.neutral.c80}
            />
            <Button
              onPress={handleSend}
              type="main"
              style={{
                width: "100%",
              }}
              mb={4}
            >
              Send
            </Button>
          </Flex>
        </KeyboardAvoidingView>
      </Flex>
    </SafeAreaView>
  );
};

export default Conversation;
