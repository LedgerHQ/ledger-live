import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { TrackScreen } from "../../../../analytics";
import { ScreenName } from "../../../../const";
import PreventNativeBack from "../../../../components/PreventNativeBack";
import ValidateSuccess from "../../../../components/ValidateSuccess";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../../components/RootNavigator/types/helpers";
import type { HederaStakeFlowParamList } from "../types";
import type { BaseNavigatorStackParamList } from "../../../../components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<
    HederaStakeFlowParamList,
    ScreenName.HederaStakeValidationSuccess
  >
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const onClose = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);
  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);
  //   const token = useMemo(() => {
  //     const options =
  //       account && account.type === "Account"
  //         ? listTokensForCryptoCurrency(account.currency)
  //         : [];
  //     return options.find(({ id }) => id === transaction.assetId);
  //   }, [account, transaction]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="HederaStake" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={
          <Trans
            i18nKey={`hedera.stake.flow.summary.amount`}
            values={{
              amount: account?.balance
                .dividedBy(100_000_000)
                .toNumber()
                .toFixed(8),
            }}
          />
        }
        description={
          <Trans
            i18nKey="hedera.stake.flow.summary.amount"
            values={{
              amount: account?.balance
                .dividedBy(100_000_000)
                .toNumber()
                .toFixed(8),
            }}
          />
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
