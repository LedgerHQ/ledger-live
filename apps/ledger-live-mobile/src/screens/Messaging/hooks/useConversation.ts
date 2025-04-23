import { useCallback } from "react";

const conversations = [
  {
    name: "With Bob",
    id: 12345,
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
    id: 6543,
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
    ],
  },
];

function useConversation() {
  const getConversations = useCallback(() => {
    return conversations;
  }, []);

  const sendMessage = useCallback((conversationId: number, message: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      throw new Error(`Conversation with id ${conversationId} not found`);
    }

    conversation.messages.push({
      message,
      author: "me",
      timestamp: new Date().toISOString(),
    });
  }, []);

  const getConversation = useCallback((id: number) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    return conversation;
  }, []);
  return {
    getConversations,
    getConversation,
    sendMessage,
  };
}

export default useConversation;
