import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { BorrowScreen } from "~/screens/PTX/Borrow";
import type { BorrowLiveAppNavigatorParamList } from "./types/BorrowLiveAppNavigator";
import type { BaseComposite, StackNavigatorProps } from "./types/helpers";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";

const Stack = createNativeStackNavigator<BorrowLiveAppNavigatorParamList>();

type NavigationProps = BaseComposite<
  StackNavigatorProps<BorrowLiveAppNavigatorParamList, ScreenName.Borrow>
>;

function useBorrowDeeplinkActions({
  paramAction,
  navigation,
  routeParams,
}: {
  paramAction: string | undefined;
  navigation: NavigationProp<ParamListBase>;
  routeParams: BorrowLiveAppNavigatorParamList[ScreenName.Borrow] | undefined;
}) {
  useEffect(() => {
    if (!paramAction) return;

    const clearDeepLink = () =>
      navigation.setParams({
        action: undefined,
        accountId: undefined,
        currencyId: undefined,
      });

    switch (paramAction) {
      case "go-back": {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else if (navigation.getParent()?.canGoBack()) {
          navigation.getParent()?.goBack();
        } else {
          navigation.navigate(NavigatorName.Borrow, {
            screen: ScreenName.Borrow,
            params: routeParams,
          });
        }
        break;
      }
      default: {
        console.warn(`BorrowLiveAppNavigator: No route for action "${paramAction}"`);
      }
    }

    return () => clearDeepLink();
  }, [paramAction, navigation, routeParams]);
}

const Borrow = (props: NavigationProps) => {
  const navigation = props.navigation as unknown as NavigationProp<ParamListBase>;

  useBorrowDeeplinkActions({
    paramAction: props.route.params?.action,
    navigation,
    routeParams: props.route.params,
  });

  return (
    <BorrowScreen
      navigation={props.navigation}
      route={{
        ...props.route,
        params: {
          platform: "borrow",
          ...props.route.params,
        },
      }}
    />
  );
};

export default function BorrowLiveAppNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator {...stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.Borrow}
        options={{ headerShown: false }}
        component={Borrow}
      />
    </Stack.Navigator>
  );
}
