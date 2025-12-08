import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { StellarAddAssetFlowParamList } from "./types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import invariant from "invariant";
import { useTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/hooks";

type Props = BaseComposite<
  StackNavigatorProps<StellarAddAssetFlowParamList, ScreenName.StellarAddAssetValidationSuccess>
>;
export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { transaction } = route.params;

  invariant(account, "Account should be present");
  invariant(account.type === "Account", "Account should not be a TokenAccount");
  invariant(transaction, "Transaction should be present");

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
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

  const { token, loading } = useTokenByAddressInCurrency(
    transaction.assetOwner!,
    account.currency.id,
  );

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="StellarAddAsset" name="ValidationSuccess" />
      <PreventNativeBack />
      {!loading && (
        <ValidateSuccess
          onClose={onClose}
          onViewDetails={goToOperationDetails}
          title={
            <Trans
              i18nKey={`stellar.addAsset.flow.steps.verification.success.title`}
              values={{
                token: token?.name,
              }}
            />
          }
          description={
            <Trans
              i18nKey="stellar.addAsset.flow.steps.verification.success.text"
              values={{
                token: token?.name,
              }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
