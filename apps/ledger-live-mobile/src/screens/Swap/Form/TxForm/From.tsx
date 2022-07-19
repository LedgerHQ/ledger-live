import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  flattenAccounts,
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { usePickDefaultAccount } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  SwapTransactionType,
  Pair,
} from "@ledgerhq/live-common/exchange/swap/types";
import { useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/live-common/types/index";
import { Selector } from "./Selector";
import { AmountInput } from "./AmountInput";
import { shallowAccountsSelector } from "../../../../reducers/accounts";
import { SwapFormProps } from "../../types";

interface Props {
  provider?: string;
  swapTx: SwapTransactionType;
  pairs: Pair[];
}

export function From({ swapTx, provider, pairs }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<SwapFormProps>();

  const accounts = useAccounts(pairs);
  const { currency, name, balance, unit } = useMemo(() => {
    const { currency, account } = swapTx.swap.from;

    return {
      account,
      currency,
      name: account && getAccountName(account),
      balance:
        (account &&
          currency &&
          formatCurrencyUnit(currency.units[0], account.balance, {
            showCode: true,
          })) ??
        "",
      unit: account && getAccountUnit(account),
    };
  }, [swapTx.swap.from]);

  usePickDefaultAccount(
    accounts,
    swapTx.swap.from.account,
    swapTx.setFromAccount,
  );

  const onPress = useCallback(() => {
    // @ts-expect-error
    navigation.navigate("SelectAccount", {
      target: "from",
      accounts,
      provider,
    });
  }, [navigation, accounts, provider]);

  return (
    <Flex
      borderBottomWidth={1}
      borderColor="neutral.c70"
      paddingBottom={4}
      marginBottom={4}
    >
      <Text>{t("transfer.swap2.form.from")}</Text>
      <Flex flexDirection="row" justifyContent="space-between">
        <Selector
          currency={currency}
          title={name}
          subTitle={balance}
          onPress={onPress}
        />

        <Flex flex={1} justifyContent="center">
          <AmountInput
            value={swapTx.swap.from.amount}
            editable={!swapTx.swap.isMaxEnabled}
            unit={unit}
            onChange={swapTx.setFromAmount}
            error={swapTx.fromAmountError}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}

type AccountLikeWithFilter = AccountLike & { disabled: boolean };

// based fromSelector on apps/ledger-live-desktop/src/renderer/actions/swap.js
function useAccounts(pairs: Pair[]): AccountLikeWithFilter[] {
  const accounts = useSelector(shallowAccountsSelector);

  const filtered = useMemo<AccountLikeWithFilter[]>(() => {
    if (pairs === null || pairs === undefined) return [];

    return flattenAccounts(accounts).map(account => {
      const id = getAccountCurrency(account).id;
      const isAccountAvailable = !!pairs.find(pair => pair.from === id);
      return { ...account, disabled: !isAccountAvailable };
    });
  }, [accounts, pairs]);

  const sorted = useMemo(() => {
    let activeAccounts: AccountLikeWithFilter[] = [];
    let disabledAccounts: AccountLikeWithFilter[] = [];
    let subAccounts = [];
    let disabledSubAccounts = [];

    // Traverse the accounts in reverse to check disabled accounts with active subAccounts
    for (let i = filtered.length - 1; i >= 0; i--) {
      const account = filtered[i];

      // Handle Account type first
      if (account.type === "Account") {
        if (account.disabled && !subAccounts.length) {
          // When a disabled account has no active subAccount, add it to the disabledAccounts
          disabledAccounts = [
            account,
            ...disabledSubAccounts,
            ...disabledAccounts,
          ];
        } else {
          // When an account has at least an active subAccount, add it to the activeAccounts
          activeAccounts = [
            account,
            ...subAccounts,
            ...disabledSubAccounts,
            ...activeAccounts,
          ];
        }

        // Clear subAccounts
        subAccounts = [];
        disabledSubAccounts = [];
      } else if (account.disabled) {
        // Add TokenAccount and ChildAccount to the subAccounts arrays
        disabledSubAccounts.unshift(account);
      } else {
        // Add TokenAccount and ChildAccount to the subAccounts arrays
        subAccounts.unshift(account);
      }
    }

    return [...activeAccounts, ...disabledAccounts];
  }, [filtered]);

  return sorted;
}
