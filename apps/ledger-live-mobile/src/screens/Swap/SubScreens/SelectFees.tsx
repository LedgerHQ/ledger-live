import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectFeesParamList } from "../types";
import SendRowsFee from "../../../components/SendRowsFee";
import NavigationScrollView from "../../../components/NavigationScrollView";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import { SWAP_VERSION } from "../utils";

export function SelectFees({ navigation, route }: SelectFeesParamList) {
  const { params } = route;
  const {
    swap: {
      from: { account, parentAccount },
    },
    transaction,
  } = params;
  const isFixed = params.rate?.tradeMethod === "fixed";

  const onSetTransaction = useCallback(
    updatedTransaction => {
      // @ts-expect-error navigation type is only partially declared
      navigation.navigate(ScreenName.SwapForm, {
        ...route.params,
        transaction: updatedTransaction,
      });
    },
    [navigation, route.params],
  );

  return (
    <SafeAreaView style={[styles.root]}>
      <TrackScreen
        category="Swap Form"
        name="Edit Fees"
        provider={params.provider}
        flow="swap"
        swapVersion={SWAP_VERSION}
      />
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
                ...params,
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
