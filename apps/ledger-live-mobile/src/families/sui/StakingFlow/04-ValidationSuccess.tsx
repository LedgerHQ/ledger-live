import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
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
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
// import { useSuiStakingPromotionRegistration } from "@ledgerhq/live-common/families/sui/react";
// import { P2P_SUI_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/sui/constants";
// import { BigNumber } from "bignumber.js";

type Props = BaseComposite<
  StackNavigatorProps<SuiStakingFlowParamList, ScreenName.SuiStakingValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { ticker } = getAccountCurrency(account);
  // const registerPromotion = useSuiStakingPromotionRegistration();

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const validator = route.params.transaction.recipient;
  const source = route.params.source?.name ?? "unknown";
  const transaction = route.params.transaction;

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      validator,
      source,
      delegation: "delegation",
      flow: "stake",
    });

    // TODO: Uncomment when ready to enable promotion registration
    // Register for promotion if staking >= 30 SUI on P2P validator
    // const stakedAmount = new BigNumber(transaction?.amount || 0);
    // const MIN_AMOUNT = new BigNumber(30).times(1e9); // 30 SUI in smallest unit
    // if (
    //   account &&
    //   validator === P2P_SUI_VALIDATOR_ADDRESS &&
    //   stakedAmount.gte(MIN_AMOUNT)
    // ) {
    //   registerPromotion(account.freshAddress);
    // }
  }, [source, validator, ticker, account, transaction]);

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
