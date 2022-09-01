import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import type { Account, AccountLikeArray } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import SendRowsFee from "../../../components/SendRowsFee";
import NavigationScrollView from "../../../components/NavigationScrollView";
import {
  RootComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

type NavigationProps = RootComposite<
  StackNavigatorProps<
    BaseNavigatorStackParamList,
    ScreenName.SwapV2FormSelectFees
  >
>;
type Props = {
  accounts?: Account[];
  allAccounts?: AccountLikeArray;
} & NavigationProps;

export default function SelectFees({ navigation, route }: Props) {
  const { transaction } = route.params;
  const { swap, provider, rate } = route.params;
  const isFixed = rate?.tradeMethod === "fixed";
  const { from: { account, parentAccount } = {} } = swap;
  const onSetTransaction = useCallback(
    updatedTransaction => {
      navigation.navigate(ScreenName.SwapForm, {
        ...route.params,
        transaction: updatedTransaction,
      });
    },
    [navigation, route.params],
  );
  return (
    <SafeAreaView style={[styles.root]}>
      <TrackScreen category="Swap Form" name="Edit Fees" provider={provider} />
      <NavigationScrollView contentContainerStyle={styles.scrollView}>
        {account && transaction ? (
          <SendRowsFee
            setTransaction={onSetTransaction}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            navigation={navigation}
            route={{
              ...route,
              params: {
                ...route.params,
                transaction: transaction as Transaction,
                accountId: account.id,
                parentAccountId: parentAccount?.id,
                currentNavigation: ScreenName.SwapForm,
              },
            }}
            disabledStrategies={isFixed ? ["slow"] : []}
          />
        ) : null}
      </NavigationScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
});
