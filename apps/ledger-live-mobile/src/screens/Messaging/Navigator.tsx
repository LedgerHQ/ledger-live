import React from "react";
import { ScreenName } from "~/const";
import CreateConversation from "./screens/CreateConversation";
import Conversation from "./screens/Conversation";
import CreateConversationProcess from "./screens/Activation/ActivationProcess";
import CreateConversationLoading from "./screens/Activation/ActivationLoading";
import JoinConversation from "./screens/Activation";
import { createStackNavigator } from "@react-navigation/stack";

export type ConversationNavigatorStackParamList = {
  [ScreenName.CreateConversation]: undefined;
  [ScreenName.Conversation]: {
    conversationId: string;
    name: string;
  };
  [ScreenName.JoinConversation]: undefined;
  [ScreenName.CreateConversationProcess]: {
    name: string;
  };
};

interface NavigatorProps {
  Stack: ReturnType<typeof createStackNavigator<ConversationNavigatorStackParamList>>;
}

export default function ConversationNavigator({ Stack }: NavigatorProps) {
  console.log("HELLO2");
  return (
    <Stack.Group>
      <Stack.Screen
        name={ScreenName.CreateConversation}
        component={CreateConversation}
        options={{
          headerShown: true,
          title: "Start a new conversation",
        }}
      />
      <Stack.Screen
        name={ScreenName.Conversation}
        component={Conversation}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.JoinConversation}
        component={JoinConversation}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CreateConversationProcess}
        component={CreateConversationProcess}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ConversationActivationLoading}
        component={CreateConversationLoading}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Group>
  );
}
