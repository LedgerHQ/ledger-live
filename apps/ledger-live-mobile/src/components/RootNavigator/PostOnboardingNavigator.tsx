import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";

import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

import PostOnboardingDebugScreen from "../../screens/PostOnboarding/PostOnboardingDebugScreen";
import PostOnboardingHub from "../../screens/PostOnboarding/PostOnboardingHub";
import PostOnboardingMockActionScreen from "../../screens/PostOnboarding/PostOnboardingMockActionScreen";
import { PostOnboardingNavigatorParamList } from "./types/PostOnboardingNavigator";

const Stack = createStackNavigator<PostOnboardingNavigatorParamList>();

const PostOnboardingNavigator = () => {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        headerShown: false,
      }}
    >
      <Stack.Screen
        name={ScreenName.PostOnboardingHub}
        component={PostOnboardingHub}
      />
      <Stack.Screen
        name={ScreenName.PostOnboardingDebugScreen}
        component={PostOnboardingDebugScreen}
      />
      <Stack.Screen
        name={ScreenName.PostOnboardingMockActionScreen}
        component={PostOnboardingMockActionScreen}
      />
    </Stack.Navigator>
  );
};

export default PostOnboardingNavigator;
