import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen, track } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SuiStakingFlowParamList } from "./types";
import { getAccountCurrency, isAccount } from "@ledgerhq/live-common/account/index";
import {
  useSuiStakingPromotionRegistration,
  useSuiStakingBanners,
} from "@ledgerhq/live-common/families/sui/react";
import {
  MIN_COUNTER_VALUE_FOR_PROMO,
  P2P_SUI_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/sui/constants";
import { counterValueCurrencySelector } from "~/reducers/settings";

type Props = BaseComposite<
  StackNavigatorProps<SuiStakingFlowParamList, ScreenName.SuiStakingValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { ticker } = getAccountCurrency(account);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const bannerConfig = useSuiStakingBanners(isAccount(account) ? account.freshAddress : undefined);
  const registerPromotion = useSuiStakingPromotionRegistration();

  const validator = route.params.transaction.recipient;
  const source = route.params.source?.name ?? "unknown";
  const operation = route.params.result;

  const counterValue = useCalculate({
    from: (isAccount(account) && account.currency) || counterValueCurrency,
    to: counterValueCurrency,
    value: operation?.value?.toNumber() || 0,
  });

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      validator,
      source,
      delegation: "delegation",
      flow: "stake",
    });

    const stakedAmountUSD = counterValue || 0;

    if (
      isAccount(account) &&
      validator === P2P_SUI_VALIDATOR_ADDRESS &&
      stakedAmountUSD >= MIN_COUNTER_VALUE_FOR_PROMO &&
      bannerConfig.isRegisterable
    ) {
      registerPromotion(account.freshAddress);
    }
  }, [
    source,
    validator,
    ticker,
    account,
    counterValue,
    bannerConfig.isRegisterable,
    registerPromotion,
  ]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="SuiStaking"
        name="ValidationSuccess"
        flow="stake"
        action="staking"
        currency="sui"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="sui.staking.flow.steps.verification.success.title" />}
        description={<Trans i18nKey="sui.staking.flow.steps.verification.success.text" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
