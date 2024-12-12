import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "~/const";
import AssetsList from "./screens/AssetsList";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

interface NavigatorProps {
  Stack: ReturnType<typeof createStackNavigator<BaseNavigatorStackParamList>>;
}

export default function Navigator({ Stack }: NavigatorProps) {
  return (
    <Stack.Group>
      <Stack.Screen name={ScreenName.AssetsList} component={AssetsList} />
    </Stack.Group>
  );
}
