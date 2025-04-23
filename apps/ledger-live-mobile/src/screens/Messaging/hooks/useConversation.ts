import { useCallback } from "react";

const conversations = [
  {
    name: "With Bob",
    id: "trustchainId1",
    messages: [
      {
        message: "Hello Bob",
        author: "Alice",
        date: new Date().toISOString(),
      },
    ],
  },
  {
    name: "With Charlie",
    id: "trustchainId2",
    messages: [
      {
        message: "Hello Charlie",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "How are you?",
        author: "Charlie",
        date: new Date().toISOString(),
      },
      {
        message: "I'm good thanks",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "Do you want some Bitcoin?",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "Hello Charlie",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "How are you?",
        author: "Charlie",
        date: new Date().toISOString(),
      },
      {
        message: "I'm good thanks",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "Do you want some Bitcoin?",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "Hello Charlie",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "How are you?",
        author: "Charlie",
        date: new Date().toISOString(),
      },
      {
        message: "I'm good thanks",
        author: "Alice",
        date: new Date().toISOString(),
      },
      {
        message: "Do you want some Bitcoin?",
        author: "Alice",
        date: new Date().toISOString(),
      },
    ],
  },
];

function useConversation() {
  const getConversations = useCallback(() => {
    return conversations;
  }, []);

  const sendMessage = useCallback((conversationId: string, message: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      throw new Error(`Conversation with id ${conversationId} not found`);
    }

    conversation.messages.push({
      message,
      author: "me",
      date: new Date().toISOString(),
    });
  }, []);

  const getConversation = useCallback((id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    return {
      ...conversation,
      messages: conversation.messages.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }),
    };
  }, []);
  return {
    getConversations,
    getConversation,
    sendMessage,
  };
}

export default useConversation;
