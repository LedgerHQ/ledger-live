import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/core";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import SwapHistory from "~/screens/Swap/History";
import Touchable from "../Touchable";

import { useTheme } from "styled-components/native";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import {
  OperationDetails,
  PendingOperation,
  SelectAccount,
  SelectCurrency,
  SelectFees,
  SelectProvider,
} from "~/screens/Swap/index";
import { SwapLiveApp } from "~/screens/Swap/LiveApp";
import StepHeader from "../StepHeader";
import SwapFormNavigator from "./SwapFormNavigator";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import { StackNavigatorNavigation, StackNavigatorProps } from "./types/helpers";
import { SwapFormNavigatorParamList } from "./types/SwapFormNavigator";
import { SwapNavigatorParamList } from "./types/SwapNavigator";

const Stack = createStackNavigator<SwapNavigatorParamList>();

export default function SwapNavigator(
  props: StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.Swap> | undefined,
) {
  const params = props?.route?.params?.params || {};
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

  const navigation = useNavigation<StackNavigatorNavigation<SwapFormNavigatorParamList>>();

  const goToSwapHistory = useCallback(() => {
    track("button_clicked", {
      button: "SwapHistory",
      page: ScreenName.SwapTab,
    });

    navigation.navigate(ScreenName.SwapHistory);
  }, [navigation]);

  const ptxSwapLiveAppMobile = useFeature("ptxSwapLiveAppMobile");

  const options = useMemo(() => {
    return !ptxSwapLiveAppMobile?.enabled
      ? {
          ...(noNanoBuyNanoWallScreenOptions as { options: object }).options,
          title: t("transfer.swap2.form.title"),
          headerLeft: () => null,
        }
      : {
          ...(noNanoBuyNanoWallScreenOptions as { options: object }).options,
          title: "",
          headerLeft: () => (
            <Text pl={4} fontWeight="semiBold" variant="h4">
              <Trans i18nKey="transfer.swap2.form.title" />
            </Text>
          ),

          headerRight: () => (
            <Flex flexDirection="row" p={6} columnGap={16}>
              <Touchable touchableTestID="NavigationHeaderSwapHistory" onPress={goToSwapHistory}>
                <Icons.Clock color={"neutral.c100"} />
              </Touchable>
              <Touchable
                touchableTestID="NavigationHeaderClose"
                onPress={() => navigation.goBack()}
              >
                <Icons.Close color={"neutral.c100"} />
              </Touchable>
            </Flex>
          ),
        };
  }, [
    goToSwapHistory,
    navigation,
    noNanoBuyNanoWallScreenOptions,
    ptxSwapLiveAppMobile?.enabled,
    t,
  ]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: true }}>
      <Stack.Screen
        name={ScreenName.SwapTab}
        component={ptxSwapLiveAppMobile?.enabled ? SwapLiveApp : SwapFormNavigator}
        {...noNanoBuyNanoWallScreenOptions}
        options={options}
        initialParams={params as Partial<SwapNavigatorParamList[ScreenName.SwapTab]>}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectAccount}
        component={SelectAccount}
        options={({
          route: {
            params: { target },
          },
        }) => ({
          headerTitle: () => <StepHeader title={t(`transfer.swap2.form.select.${target}.title`)} />,
          headerRight: () => null,
        })}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectCurrency}
        component={SelectCurrency}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.select.to.title")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectProvider}
        component={SelectProvider}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.details.label.provider")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapSelectFees}
        component={SelectFees}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap2.form.details.label.fees")} />,
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapPendingOperation}
        component={PendingOperation}
        options={{
          headerTitle: t("transfer.swap.title"),
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.SwapOperationDetails}
        component={OperationDetails}
        options={({ route }) => ({
          headerTitle: t("transfer.swap.title"),
          headerLeft: route.params?.fromPendingOperation ? () => null : undefined,
        })}
      />

      {ptxSwapLiveAppMobile?.enabled ? (
        <Stack.Screen
          name={ScreenName.SwapHistory}
          component={SwapHistory}
          options={{
            title: t("transfer.swap.history.tab"),
            headerRight: () => null,
          }}
        />
      ) : null}
    </Stack.Navigator>
  );
}
