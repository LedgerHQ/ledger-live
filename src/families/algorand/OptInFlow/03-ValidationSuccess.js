/* @flow */
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import { listTokensForCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import colors from "../../../colors";
import { ScreenName } from "../../../const";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: any,
  result: Operation,
};

export default function ValidationSuccess({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  const { transaction } = route.params;

  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
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

  const options = listTokensForCryptoCurrency(account.currency);
  const token = useMemo(
    () => options.find(({ id }) => id === transaction.assetId),
    [options, transaction],
  );

  return (
    <View style={styles.root}>
      <TrackScreen category="AlgorandOptIn" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={
          <Trans
            i18nKey={`algorand.optIn.flow.steps.verification.success.title`}
            values={{ token: token.name }}
          />
        }
        description={
          <Trans
            i18nKey="algorand.optIn.flow.steps.verification.success.text"
            values={{ token: token.name }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
  },
  label: { fontSize: 12 },
  subLabel: { color: colors.grey },
});
