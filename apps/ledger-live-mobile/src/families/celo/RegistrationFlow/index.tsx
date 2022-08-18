import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import ConnectDevice from "../../../screens/ConnectDevice";
import SelectDevice from "../../../screens/SelectDevice";
import RegistrationStarted from "./01-Started";

const totalSteps = "3";

function RegistrationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.CeloRegistrationStarted}
        component={RegistrationStarted}
        options={{
          headerTitle: () => (
            <StepHeader title={t("celo.simpleOperation.modes.register.title")} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { RegistrationFlow as component, options };

const Stack = createStackNavigator();
