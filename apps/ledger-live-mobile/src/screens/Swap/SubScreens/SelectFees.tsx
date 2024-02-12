import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectFeesParamList } from "../types";
import SendRowsFee from "~/components/SendRowsFee";
import NavigationScrollView from "~/components/NavigationScrollView";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
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
    (updatedTransaction: NonNullable<typeof transaction>) => {
      // @ts-expect-error navigation type is only partially declared
      navigation.navigate(ScreenName.SwapForm, {
        transaction: updatedTransaction,
        merge: true,
      });
    },
    [navigation],
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
            /**
             * This is needed to avoid a React side effect caused by the
             * onSetTransaction callback above. The callback is called
             * when a tx is updated, which causes a navigation back to the
             * SwapForm screen. This causes the SendRowsFee screen to unmount.
             * If we prefill the gas options, the tx will get updated when the
             * SendRowsFee screen mounts, which causes the callback to be called
             * cf. apps/ledger-live-mobile/src/families/evm/EvmFeesStrategy.tsx
             */
            shouldPrefillEvmGasOptions={false}
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
