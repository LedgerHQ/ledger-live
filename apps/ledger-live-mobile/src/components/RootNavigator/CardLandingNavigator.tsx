import React from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { CardLandingScreen } from "LLM/features/CardLanding";
import TabIcon from "../TabIcon";
import type { CardLandingNavigatorParamList } from "./types/CardLandingNavigator";

const Stack = createNativeStackNavigator<CardLandingNavigatorParamList>();

export const CardTabIcon = (
  props: Omit<React.ComponentProps<typeof TabIcon>, "Icon" | "i18nKey">,
) => {
  return (
    <TabIcon Icon={IconsLegacy.CardMedium} i18nKey="tabs.card" testID="tab-bar-card" {...props} />
  );
};

export default function CardLandingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.Card} component={CardLandingScreen} />
    </Stack.Navigator>
  );
}
