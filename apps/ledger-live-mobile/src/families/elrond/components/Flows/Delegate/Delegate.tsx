// @flow

import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";

import StepHeader from "../../../../../components/StepHeader";
import { getStackNavigatorConfig } from "../../../../../navigation/navigatorConfig";
import { ScreenName } from "../../../../../const";

import EarnRewards from "./components/EarnRewards";
import SetDelegation from "./components/SetDelegation";
import PickValidator from "./components/PickValidator";
import ValidationError from "./components/ValidationError";
import ValidationSuccess from "./components/ValidationSuccess";

import SelectDevice from "../../../../../screens/SelectDevice";
import ConnectDevice from "../../../../../screens/ConnectDevice";

const totalSteps = "3";
const options = {
  headerShown: false,
};

/*
 * Handle the component declaration.
 */

const Delegate = () => {
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
        name: ScreenName.ElrondDelegationStarted,
        component: EarnRewards,
        heading: {
          title: "delegation.started.title",
        },
      },
      {
        name: ScreenName.ElrondDelegationValidator,
        component: SetDelegation,
        heading: {
          title: "elrond.delegation.stepperHeader.validator",
          subtitle: {
            label: "elrond.delegation.stepperHeader.stepRange",
            variables: {
              currentStep: "1",
              totalSteps,
            },
          },
        },
        options: {
          gestureEnabled: false,
        },
      },
      {
        name: ScreenName.ElrondDelegationValidatorList,
        component: PickValidator,
        heading: {
          title: "elrond.delegation.stepperHeader.selectDevice",
          subtitle: {
            label: "elrond.delegation.stepperHeader.stepRange",
            variables: {
              currentStep: "2",
              totalSteps,
            },
          },
        },
      },
      {
        name: ScreenName.ElrondDelegationSelectDevice,
        component: SelectDevice,
        heading: {
          title: "elrond.delegation.stepperHeader.selectDevice",
          subtitle: {
            label: "elrond.delegation.stepperHeader.stepRange",
            variables: {
              currentStep: "3",
              totalSteps,
            },
          },
        },
      },
      {
        name: ScreenName.ElrondClaimRewardsConnectDevice,
        component: ConnectDevice,
        heading: {
          title: "elrond.delegation.stepperHeader.connectDevice",
          subtitle: {
            label: "elrond.delegation.stepperHeader.stepRange",
            variables: {
              currentStep: "3",
              totalSteps,
            },
          },
        },
        options: {
          headerLeft: null,
          gestureEnabled: false,
        },
      },
      {
        name: ScreenName.ElrondDelegationValidationError,
        component: ValidationError,
        options: {
          headerShown: false,
          gestureEnabled: false,
        },
      },
      {
        name: ScreenName.ElrondDelegationValidationSuccess,
        component: ValidationSuccess,
        options: {
          headerLeft: () => null,
          headerRight: () => null,
          headerTitle: "",
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
  //   <Stack.Navigator
  //     screenOptions={{
  //       ...stackNavigationConfig,
  //       gestureEnabled: Platform.OS === "ios",
  //     }}
  //   >
  //     {stacks.map(stack => (
  //       <Stack.Screen
  //         key={stack.name}
  //         name={stack.name}
  //         component={stack.component}
  //         options={Object.assign(stack.options || {}, {
  //           headerTitle: stack.heading
  //             ? () => (
  //                 <StepHeader
  //                   title={t(stack.heading.title)}
  //                   subtitle={
  //                     stack.heading.subtitle
  //                       ? t(
  //                           stack.heading.subtitle.label,
  //                           stack.heading.subtitle.variables,
  //                         )
  //                       : null
  //                   }
  //                 />
  //               )
  //             : undefined,
  //         })}
  //       />
  //     ))}
  //   </Stack.Navigator>
  // );
};

export { Delegate as component, options };

const Stack = createStackNavigator();
