import React, { useCallback, useState } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import BigNumber from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Icons, Text } from "@ledgerhq/native-ui";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";
import LText from "~/components/LText";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { findSubAccountById, getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  FEE_CURRENCY_BY_CONTRACT,
  FEE_CURRENCY_OPTIONS,
} from "@ledgerhq/live-common/families/celo/logic";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type {
  CeloAccount,
  Transaction as CeloTransaction,
} from "@ledgerhq/live-common/families/celo/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

type Props = {
  readonly account: Account;
  readonly parentAccount?: Account | null;
  readonly transaction: Transaction;
  readonly setTransaction: (transaction: Transaction) => void;
};

export function SendRecipientFields({
  account,
  parentAccount,
  transaction,
  setTransaction,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const bridge = useAccountBridge<CeloTransaction>(account, parentAccount);
  const celoTransaction = transaction as CeloTransaction;
  const mainAccount = getMainAccount(account, parentAccount) as CeloAccount;

  const feeCurrencyAccount = celoTransaction.feeCurrencyAccountId
    ? findSubAccountById(mainAccount, celoTransaction.feeCurrencyAccountId)
    : null;

  const selectedName = feeCurrencyAccount
    ? FEE_CURRENCY_BY_CONTRACT.get(feeCurrencyAccount.token.contractAddress.toLowerCase())?.name ??
      FEE_CURRENCY_OPTIONS[0].name
    : FEE_CURRENCY_OPTIONS[0].name;

  // Only supported token sub-accounts
  const tokenOptions: (TokenAccount & { feeCurrencyName: string })[] = (
    mainAccount.subAccounts ?? []
  )
    .filter((sub): sub is TokenAccount => sub.type === "TokenAccount")
    .filter(sub => new BigNumber(sub.balance).gt(0))
    .filter(sub => FEE_CURRENCY_BY_CONTRACT.has(sub.token.contractAddress.toLowerCase()))
    .map(sub => ({
      ...sub,
      feeCurrencyName:
        FEE_CURRENCY_BY_CONTRACT.get(sub.token.contractAddress.toLowerCase())?.name ??
        sub.token.name,
    }));

  const onSelectNative = useCallback(() => {
    setTransaction(
      bridge.updateTransaction(celoTransaction, {
        feeCurrency: null,
        feeCurrencyUnwrapped: null,
        feeCurrencyAccountId: null,
      }),
    );
    setDrawerOpen(false);
  }, [bridge, celoTransaction, setTransaction]);

  const onSelectToken = useCallback(
    (tokenAccount: AccountLike) => {
      if (tokenAccount.type !== "TokenAccount") return;
      const contractAddress = tokenAccount.token.contractAddress;
      const matchedOption = FEE_CURRENCY_BY_CONTRACT.get(contractAddress.toLowerCase());
      if (!matchedOption) {
        setTransaction(
          bridge.updateTransaction(celoTransaction, {
            feeCurrency: null,
            feeCurrencyUnwrapped: null,
            feeCurrencyAccountId: null,
          }),
        );
        setDrawerOpen(false);
        return;
      }

      const feeCurrency = matchedOption?.adapterAddress ?? matchedOption?.contractAddress ?? null;
      const feeCurrencyUnwrapped = matchedOption?.contractAddress ?? null;

      setTransaction(
        bridge.updateTransaction(celoTransaction, {
          feeCurrency,
          feeCurrencyUnwrapped,
          feeCurrencyAccountId: tokenAccount.id,
        }),
      );
      setDrawerOpen(false);
    },
    [bridge, celoTransaction, setTransaction],
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
          selected={!celoTransaction.feeCurrencyAccountId}
          onPress={onSelectNative}
        />
        {tokenOptions.map(tokenAccount => (
          <FeeCurrencyOption
            key={tokenAccount.id}
            label={tokenAccount.feeCurrencyName}
            selected={celoTransaction.feeCurrencyAccountId === tokenAccount.id}
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

export default { SendRecipientFields };

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
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
