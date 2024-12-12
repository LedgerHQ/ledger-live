import React, { useCallback } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "~/const";
import AssetsList from "./screens/AssetsList";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { track } from "~/analytics";
import { useNavigation } from "@react-navigation/native";

interface NavigatorProps {
  Stack: ReturnType<typeof createStackNavigator<BaseNavigatorStackParamList>>;
}

export default function Navigator({ Stack }: NavigatorProps) {
  const navigation = useNavigation();

  const handleGoBack = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: "Assets",
    });
    navigation.goBack();
  }, [navigation]);

  const headerLeft = useCallback(
    () => <NavigationHeaderBackButton onPress={handleGoBack} />,
    [handleGoBack],
  );

  return (
    <Stack.Group>
      <Stack.Screen
        name={ScreenName.AssetsList}
        component={AssetsList}
        options={{
          headerRight: () => null,
          headerTitle: () => null,
          headerLeft: headerLeft,
        }}
      />
    </Stack.Group>
  );
}
