// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";

import { getStackNavigatorConfig } from "../../../../../navigation/navigatorConfig";
import StepHeader from "../../../../../components/StepHeader";
import { ScreenName } from "../../../../../const";
import WithdrawMethod from "./01-SelectValidator.jsx";
import WithdrawSelectDevice from "../../../../../screens/SelectDevice";
import WithdrawConnectDevice from "../../../../../screens/ConnectDevice";
import WithdrawValidationError from "./04-ValidationError.jsx";
import WithdrawValidationSuccess from "./04-ValidationSuccess.jsx";

const Stack = createStackNavigator();
const totalSteps = "3";
const options = {
  headerShown: false,
};

const Claim = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  const stacks = useMemo(
    () => [
      {
        name: ScreenName.ElrondWithdrawMethod,
        component: WithdrawMethod,
        heading: {
          title: "elrond.withdraw.stepperHeader.method",
        },
      },
      {
        name: ScreenName.ElrondWithdrawSelectDevice,
        component: WithdrawSelectDevice,
        heading: {
          title: "elrond.withdraw.stepperHeader.selectDevice",
          subtitle: {
            label: "elrond.withdraw.stepperHeader.stepRange",
            variables: {
              currentStep: "2",
              totalSteps,
            },
          },
        },
      },
      {
        name: ScreenName.ElrondWithdrawConnectDevice,
        component: WithdrawConnectDevice,
        heading: {
          title: "elrond.withdraw.stepperHeader.connectDevice",
          subtitle: {
            label: "elrond.withdraw.stepperHeader.stepRange",
            variables: {
              currentStep: "3",
              totalSteps,
            },
          },
        },
      },
      {
        name: ScreenName.ElrondWithdrawValidationError,
        component: WithdrawValidationError,
        options: {
          headerShown: false,
          gestureEnabled: false,
        },
      },
      {
        name: ScreenName.ElrondClaimRewardsValidationSuccess,
        component: WithdrawValidationSuccess,
        options: {
          headerLeft: null,
          headerRight: null,
          headerTitle: null,
          gestureEnabled: false,
        },
      },
    ],
    [],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      {stacks.map(stack => (
        <Stack.Screen
          key={stack.name}
          name={stack.name}
          component={stack.component}
          options={{
            ...stack.options,
            headerTitle: stack.heading
              ? () => (
                  <StepHeader
                    title={t(stack.heading.title)}
                    subtitle={
                      stack.heading.subtitle
                        ? t(
                            stack.heading.subtitle.label,
                            stack.heading.subtitle.variables,
                          )
                        : ""
                    }
                  />
                )
              : null,
          }}
        />
      ))}
    </Stack.Navigator>
  );
};

export { Claim as component, options };
