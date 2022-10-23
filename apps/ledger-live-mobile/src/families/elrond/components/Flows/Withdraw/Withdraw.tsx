// @flow

import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";

import StepHeader from "../../../../../components/StepHeader";
import WithdrawSelectDevice from "../../../../../screens/SelectDevice";
import WithdrawConnectDevice from "../../../../../screens/ConnectDevice";

import { getStackNavigatorConfig } from "../../../../../navigation/navigatorConfig";
import { ScreenName } from "../../../../../const";

import WithdrawFunds from "./components/WithdrawFunds";
import ValidationError from "./components/ValidationError";
import ValidationSuccess from "./components/ValidationSuccess";

const Stack = createStackNavigator();
const totalSteps = "3";
const options = {
  headerShown: false,
};

/*
 * Handle the component declaration.
 */

const Withdraw = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  /*
   * Create a memoized list of all the stacks and their specific parameters.
   */

  const stacks = useMemo(
    () => [
      {
        name: ScreenName.ElrondWithdrawFunds,
        component: WithdrawFunds,
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
        component: ValidationError,
        options: {
          headerShown: false,
          gestureEnabled: false,
        },
      },
      {
        name: ScreenName.ElrondWithdrawValidationSuccess,
        component: ValidationSuccess,
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

  /*
   * Return the rendered component.
   */

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
          options={Object.assign(stack.options || {}, {
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
                        : null
                    }
                  />
                )
              : undefined,
          })}
        />
      ))}
    </Stack.Navigator>
  );
};

export { Withdraw as component, options };
