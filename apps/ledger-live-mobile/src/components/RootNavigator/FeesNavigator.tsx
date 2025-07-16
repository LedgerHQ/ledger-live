import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { FeesNavigatorParamsList } from "./types/FeesNavigator";
import { ScreenName } from "~/const";
import StepHeader from "../StepHeader";
import { useTranslation } from "react-i18next";
import { FeesScreen } from "~/screens/Fees";
import { Text } from "@ledgerhq/native-ui";

const Stack = createStackNavigator<FeesNavigatorParamsList>();

export default function FeesNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={{ ...stackNavConfig }}>
      <Stack.Screen
        name={ScreenName.FeeHomePage}
        component={FeesScreen}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.title")} subtitle={undefined} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.FeeCustomFeePage}
        component={() => <Text>{"custom fee page"}</Text>}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap2.form.title")} subtitle={undefined} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}
