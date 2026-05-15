import React, { useCallback, useMemo } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex } from "@ledgerhq/native-ui";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSendFlowActions, useSendFlowData } from "~/mvvm/features/Send/context/SendFlowContext";
import { RecipientScreenView } from "~/mvvm/features/Send/screens/Recipient/components/RecipientScreenView";
import { BalanceSelector } from "../../shared/BalanceSelector";
import type { AleoTransaction } from "@ledgerhq/coin-aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/types";

type BalanceType = "public" | "private";

export function AleoRecipientScreen() {
  const { state } = useSendFlowData();
  const { updateTransaction } = useSendFlowActions();
  const { account } = state;

  const currency = getAccountCurrency(account);

  // Determine current balance type from transaction mode
  const selectedBalanceType = useMemo((): BalanceType => {
    const transaction = state.transaction as AleoTransaction | undefined;
    if (!transaction) return "public";

    return transaction.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ? "private" : "public";
  }, [state.transaction]);

  const handleBalanceTypeChange = useCallback(
    (type: BalanceType) => {
      updateTransaction(tx => {
        const aleoTx = tx as AleoTransaction;

        if (type === "public") {
          // Remove properties, set TRANSFER_PUBLIC mode
          const { properties: _ignoredProperties, ...txWithoutProperties } = aleoTx;
          return {
            ...txWithoutProperties,
            mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
          };
        }

        // Set TRANSFER_PRIVATE mode with empty record selections
        return {
          ...aleoTx,
          mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          properties: {
            amountRecordCommitments: [],
            feeRecordCommitment: null,
          },
        };
      });
    },
    [updateTransaction],
  );

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Flex px={6} pt={4}>
          <BalanceSelector
            account={account}
            selectedType={selectedBalanceType}
            onChange={handleBalanceTypeChange}
          />
        </Flex>

        <RecipientScreenView />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
