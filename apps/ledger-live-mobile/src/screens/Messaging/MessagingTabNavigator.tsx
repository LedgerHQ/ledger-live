import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import ConversationList from "./screens/ConversationList";
import CreateConversation from "./screens/CreateConversation";
import Conversation from "./screens/Conversation";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";

export type MessagingNavigatorStackParamList = {
  [ScreenName.CreateConversation]: undefined;
  [ScreenName.Conversation]: {
    conversationId: string;
  };
  [ScreenName.ConversationList]: undefined;
};

const Stack = createStackNavigator<MessagingNavigatorStackParamList>();

export default function MessagingTabNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={stackNavigationConfig}
      initialRouteName={ScreenName.ConversationList}
    >
      <Stack.Screen
        name={ScreenName.ConversationList}
        component={ConversationList}
        options={{
          headerShown: true,
          title: "",
          headerRight: undefined,
          headerLeft: () => null,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name={ScreenName.CreateConversation}
        component={CreateConversation}
        options={{
          headerShown: true,
          title: "",
          headerRight: undefined,
          headerLeft: () => null,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name={ScreenName.Conversation}
        component={Conversation}
        options={{
          headerShown: true,
          title: "",
          headerRight: undefined,
          headerLeft: () => null,
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
}
