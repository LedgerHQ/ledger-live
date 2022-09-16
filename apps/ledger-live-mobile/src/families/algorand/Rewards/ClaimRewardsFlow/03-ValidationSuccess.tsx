import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type { Operation } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { TrackScreen } from "../../../../analytics";
import { ScreenName } from "../../../../const";
import PreventNativeBack from "../../../../components/PreventNativeBack";
import ValidateSuccess from "../../../../components/ValidateSuccess";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
  deviceId: string;
  transaction: any;
  result: Operation;
};
export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const onClose = useCallback(() => {
    navigation.getParent().pop();
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
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="AlgorandClaimRewards" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={
          <Trans
            i18nKey={`algorand.claimRewards.flow.steps.verification.success.title`}
          />
        }
        description={
          <Trans i18nKey="algorand.claimRewards.flow.steps.verification.success.text" />
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
