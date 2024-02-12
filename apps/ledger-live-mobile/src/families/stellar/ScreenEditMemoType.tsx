import React from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import i18next from "i18next";
import { StellarMemoType } from "@ledgerhq/live-common/families/stellar/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import LText from "~/components/LText";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import makeGenericSelectScreen from "~/screens/makeGenericSelectScreen";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

const items = StellarMemoType.map(type => ({
  label: type,
  value: type,
}));

type NavigationProps = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.StellarEditMemoType>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.StellarEditMemoType>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.StellarEditMemoType>
>;

const mapStateToProps = (_state: State, props: NavigationProps) => ({
  selectedKey: props.route.params.transaction.memoType
    ? props.route.params.transaction.memoType
    : "NO_MEMO",
  items,
  cancelNavigateBack: true,
  onValueChange: ({ value }: { value: string; label: string }) => {
    const { navigation, route } = props;
    const { transaction, account } = route.params;

    if (value === "NO_MEMO") {
      const bridge = getAccountBridge(account);
      // @ts-expect-error FIXME: No current / next navigation params?
      navigation.navigate(ScreenName.SendSummary, {
        accountId: account.id,
        transaction: bridge.updateTransaction(transaction, {
          memoType: value,
          memoValue: null,
        }),
      });
    } else {
      // @ts-expect-error FIXME: No current / next navigation params?
      navigation.navigate(ScreenName.StellarEditMemoValue, {
        accountId: account.id,
        transaction,
        memoType: value,
      });
    }
  },
});

const Screen = connect(mapStateToProps)(
  makeGenericSelectScreen({
    id: "StellarEditMemoType",
    itemEventProperties: item => ({
      memoType: item.value,
    }),
    keyExtractor: item => item.value,
    formatItem: item => i18next.t(`stellar.memoType.${item.label}`) as React.ReactNode,
    ListHeaderComponent: () => (
      <View style={styles.memo}>
        <LText style={styles.text}>
          <Trans i18nKey="stellar.memo.warning" />
        </LText>
      </View>
    ),
  }),
);
const options = {
  title: i18next.t("send.summary.memo.type"),
  headerLeft: undefined,
};
const styles = StyleSheet.create({
  memo: {
    marginBottom: 16,
    padding: 16,
  },
  text: {
    fontSize: 14,
  },
});
export { Screen as component, options };
