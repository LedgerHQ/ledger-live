import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";

import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

import { ParamList } from "../../screens/PostOnboarding/types";
import PostOnboardingDebugScreen from "../../screens/PostOnboarding/PostOnboardingDebugScreen";
import PostOnboardingHub from "../../screens/PostOnboarding/PostOnboardingHub";
import PostOnboardingMockActionScreen from "../../screens/PostOnboarding/PostOnboardingMockActionScreen";

const Stack = createStackNavigator<ParamList>();

const screenOptions = { headerShown: true, title: "", headerLeft: () => null };

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
        name={ScreenName.PostOnboardingHub as "PostOnboardingHub"}
        component={PostOnboardingHub}
        options={screenOptions}
      />
      <Stack.Screen
        name={
          ScreenName.PostOnboardingDebugScreen as "PostOnboardingDebugScreen"
        }
        component={PostOnboardingDebugScreen}
      />
      <Stack.Screen
        name={
          ScreenName.PostOnboardingMockActionScreen as "PostOnboardingMockActionScreen"
        }
        component={PostOnboardingMockActionScreen}
        options={screenOptions}
      />
    </Stack.Navigator>
  );
};

export default PostOnboardingNavigator;
