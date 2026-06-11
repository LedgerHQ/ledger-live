import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Icons, Text } from "@ledgerhq/native-ui";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";
import LText from "~/components/LText";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as CeloTransaction } from "@ledgerhq/live-common/families/celo/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { findSubAccountById, getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  FEE_CURRENCY_BY_CONTRACT,
  FEE_CURRENCY_OPTIONS,
} from "@ledgerhq/live-common/families/celo/logic";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

function isCeloTransaction(tx: Transaction): tx is CeloTransaction {
  return tx.family === "celo";
}

function CeloFeeCurrencyPluginInner({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: Props & { transaction: CeloTransaction }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const selectedName = useMemo(() => {
    if (!transaction.feeCurrencyAccountId) return FEE_CURRENCY_OPTIONS[0].name;
    // Resolve via the contract address on the transaction itself — always present
    // when a token fee currency is selected, so the label stays correct even while
    // sub-accounts are still hydrating.
    if (transaction.feeCurrencyUnwrapped) {
      const matched = FEE_CURRENCY_BY_CONTRACT.get(transaction.feeCurrencyUnwrapped.toLowerCase());
      if (matched) return matched.name;
    }
    const sub = findSubAccountById(mainAccount, transaction.feeCurrencyAccountId);
    if (sub?.type !== "TokenAccount") return FEE_CURRENCY_OPTIONS[0].name;
    return (
      FEE_CURRENCY_BY_CONTRACT.get(sub.token.contractAddress.toLowerCase())?.name ??
      FEE_CURRENCY_OPTIONS[0].name
    );
  }, [transaction.feeCurrencyAccountId, transaction.feeCurrencyUnwrapped, mainAccount]);

  const tokenOptions: (TokenAccount & { feeCurrencyName: string })[] = useMemo(
    () =>
      (mainAccount.subAccounts ?? [])
        .filter((sub): sub is TokenAccount => sub.type === "TokenAccount")
        .filter(sub => sub.balance.gt(0))
        .filter(sub => FEE_CURRENCY_BY_CONTRACT.has(sub.token.contractAddress.toLowerCase()))
        .map(sub => ({
          ...sub,
          feeCurrencyName:
            FEE_CURRENCY_BY_CONTRACT.get(sub.token.contractAddress.toLowerCase())?.name ??
            sub.token.name,
        })),
    [mainAccount.subAccounts],
  );

  useEffect(() => {
    if (!transaction.feeCurrencyAccountId) return;
    if (mainAccount.subAccounts === undefined) return;
    const stillSelectable = tokenOptions.some(t => t.id === transaction.feeCurrencyAccountId);
    if (stillSelectable) return;
    transactionActions.updateTransaction(tx => ({
      ...tx,
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    }));
  }, [transaction.feeCurrencyAccountId, mainAccount.subAccounts, tokenOptions, transactionActions]);

  const onSelectNative = useCallback(() => {
    transactionActions.updateTransaction(tx => ({
      ...tx,
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    }));
    setDrawerOpen(false);
  }, [transactionActions]);

  const onSelectToken = useCallback(
    (tokenAccount: AccountLike) => {
      if (tokenAccount.type !== "TokenAccount") return;
      const contractAddress = tokenAccount.token.contractAddress;
      const matchedOption = FEE_CURRENCY_BY_CONTRACT.get(contractAddress.toLowerCase());

      if (!matchedOption) {
        transactionActions.updateTransaction(tx => ({
          ...tx,
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        }));
        setDrawerOpen(false);
        return;
      }

      const feeCurrency = matchedOption.adapterAddress ?? matchedOption.contractAddress ?? null;
      const feeCurrencyUnwrapped = matchedOption.contractAddress ?? null;

      transactionActions.updateTransaction(tx => ({
        ...tx,
        feeCurrency,
        feeCurrencyUnwrapped,
        feeCurrencyAccountId: tokenAccount.id,
      }));
      setDrawerOpen(false);
    },
    [transactionActions],
  );

  return (
    <View style={styles.container}>
      <LText style={styles.label} color="grey">
        {t("celo.send.feeCurrency")}
      </LText>
      <TouchableOpacity
        style={[styles.selector, { borderColor: colors.lightGrey }]}
        onPress={() => setDrawerOpen(true)}
      >
        <LText semiBold style={styles.selectorText}>
          {selectedName}
        </LText>
        <Icons.ChevronDown size="S" color="neutral.c70" />
      </TouchableOpacity>

      <QueuedDrawer
        title={
          <Text variant="h4" textTransform="none">
            {t("celo.send.feeCurrency")}
          </Text>
        }
        isRequestingToBeOpened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <FeeCurrencyOption
          label={FEE_CURRENCY_OPTIONS[0].name}
          selected={!transaction.feeCurrencyAccountId}
          onPress={onSelectNative}
        />
        {tokenOptions.map(tokenAccount => (
          <FeeCurrencyOption
            key={tokenAccount.id}
            label={tokenAccount.feeCurrencyName}
            selected={transaction.feeCurrencyAccountId === tokenAccount.id}
            onPress={() => onSelectToken(tokenAccount)}
          />
        ))}
      </QueuedDrawer>
    </View>
  );
}

type OptionProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
};

function FeeCurrencyOption({ label, selected, onPress }: OptionProps) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Text fontSize="body" fontWeight="semiBold" color={selected ? "primary.c80" : "neutral.c100"}>
        {label}
      </Text>
      {selected && (
        <Circle size={24} style={styles.checkIcon}>
          <Icons.CheckmarkCircleFill size="M" color="primary.c80" />
        </Circle>
      )}
    </TouchableOpacity>
  );
}

export function CeloFeeCurrencyPlugin({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: Props) {
  if (!isCeloTransaction(transaction)) return null;

  return (
    <CeloFeeCurrencyPluginInner
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      transactionActions={transactionActions}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
  },
  option: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  checkIcon: {
    position: "absolute",
    right: 0,
  },
});
