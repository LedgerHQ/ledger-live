import { Operation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/families/solana/types";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import invariant from "invariant";
import { TrackScreen } from "../../../analytics";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  accountId: string;
  deviceId: string;
  transaction: Transaction;
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

  const transaction = route.params.transaction;
  invariant(transaction.family === "solana", "solana tx expected");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="SendFunds" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey={"solana.delegation.broadcastSuccessTitle"} />}
        description={
          <Trans i18nKey={"solana.delegation.broadcastSuccessDescription"} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
});
