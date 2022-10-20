// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import {
  getStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../../../navigation/navigatorConfig";
import StepHeader from "../../../../../components/StepHeader";
import { ScreenName } from "../../../../../const";
import PickValidator from "./1-Pick-Validator";
import PickMethod from "./2-Pick-Method";

import ClaimRewardsSelectDevice from "../../../../../screens/SelectDevice";
import ClaimRewardsConnectDevice from "../../../../../screens/ConnectDevice";
import ClaimRewardsValidationError from "./04-ValidationError";
import ClaimRewardsValidationSuccess from "./04-ValidationSuccess";

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
        name: ScreenName.ElrondClaimRewardsValidator,
        component: PickValidator,
        heading: {
          title: "elrond.claimRewards.stepperHeader.validator",
          subtitle: {
            label: "elrond.claimRewards.stepperHeader.stepRange",
            variables: {
              currentStep: "1",
              totalSteps,
            },
          },
        },
        options: {
          headerLeft: null,
          gestureEnabled: false,
          headerStyle: {
            ...defaultNavigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        },
      },
      {
        name: ScreenName.ElrondClaimRewardsMethod,
        component: PickMethod,
        heading: {
          title: "elrond.claimRewards.stepperHeader.method",
        },
      },
      {
        name: ScreenName.ElrondClaimRewardsSelectDevice,
        component: ClaimRewardsSelectDevice,
        heading: {
          title: "elrond.claimRewards.stepperHeader.selectDevice",
          subtitle: {
            label: "elrond.claimRewards.stepperHeader.stepRange",
            variables: {
              currentStep: "2",
              totalSteps,
            },
          },
        },
      },
      {
        name: ScreenName.ElrondClaimRewardsConnectDevice,
        component: ClaimRewardsConnectDevice,
        heading: {
          title: "elrond.claimRewards.stepperHeader.connectDevice",
          subtitle: {
            label: "elrond.claimRewards.stepperHeader.stepRange",
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
        name: ScreenName.ElrondClaimRewardsValidationError,
        component: ClaimRewardsValidationError,
        options: {
          headerShown: false,
          gestureEnabled: false,
        },
      },
      {
        name: ScreenName.ElrondClaimRewardsValidationSuccess,
        component: ClaimRewardsValidationSuccess,
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

export { Claim as component, options };
