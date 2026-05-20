import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Button } from "@ledgerhq/native-ui";
import type { AleoAccount, Transaction } from "@ledgerhq/coin-aleo/types";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "~/mvvm/features/Send/context/SendFlowContext";
import type { SendFlowNavigationProp } from "~/mvvm/features/Send/types";
import { SendFlowLayout } from "~/mvvm/features/Send/components/SendFlowLayout";
import { RecipientScreenView } from "~/mvvm/features/Send/screens/Recipient/components/RecipientScreenView";
import { BalanceSelector } from "../components/BalanceSelector";

/**
 * Aleo-specific Recipient screen that adds balance selector (public/private toggle)
 * and self-transfer button before the standard recipient input.
 */
export function AleoRecipientScreen() {
  const { t } = useTranslation();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();

  console.log("[AleoRecipientScreen] Rendered!");

  const account = state.account.account as AleoAccount | null;
  const parentAccount = state.account.parentAccount;
  const txn = state.transaction.transaction as Transaction | null;

  const currency: CryptoOrTokenCurrency | null = useMemo(() => {
    if (state.account.currency) return state.account.currency;
    return account ? getAccountCurrency(account) : null;
  }, [state.account.currency, account]);

  console.log("[AleoRecipientScreen] Account:", account?.name, "Currency:", currency?.id, "Transaction mode:", txn?.mode);

  const handleAddressSelected = useCallback(
    (address: string, ensName?: string) => {
      transaction.setRecipient({
        address,
        ensName,
      });

      recipientSearch.clear();
      navigation.navigate(ScreenName.SendFlowAmount);
    },
    [transaction, recipientSearch, navigation],
  );

  const handleBalanceChange = useCallback(
    (updatedTransaction: Transaction) => {
      transaction.setTransaction(updatedTransaction);
    },
    [transaction],
  );

  const handleSelfTransferPress = useCallback(() => {
    navigation.navigate(ScreenName.AleoSelfTransfer as any);
  }, [navigation]);

  console.log("[AleoRecipientScreen] Rendering, account:", !!account, "currency:", !!currency, "txn:", !!txn);

  if (!account || !currency || !txn) {
    console.log("[AleoRecipientScreen] Missing data, returning null");
    return null;
  }

  // RecipientScreenView already has SendFlowLayout, so we just add our UI before it
  return (
    <>
      {/* Aleo-specific UI - rendered above recipient input */}
      <SendFlowLayout>
        <Box px={6} mb={4}>
          <BalanceSelector
            account={account}
            transaction={txn}
            onChange={handleBalanceChange}
          />
        </Box>

        <Box px={6}>
          <Button
            type="shade"
            size="large"
            outline
            onPress={handleSelfTransferPress}
          >
            {t("aleo.send.selfTransfer.button")}
          </Button>
        </Box>
      </SendFlowLayout>

      {/* Standard Recipient Input (has its own SendFlowLayout) */}
      <RecipientScreenView
        account={account}
        parentAccount={parentAccount}
        currency={currency}
        onAddressSelected={handleAddressSelected}
        recipientSupportsDomain={uiConfig.recipientSupportsDomain}
      />
    </>
  );
}
  );
}
