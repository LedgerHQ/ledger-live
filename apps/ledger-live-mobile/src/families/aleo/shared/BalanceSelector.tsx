import React from "react";
import { StyleSheet } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { BalanceOption } from "./BalanceOption";
import type { Account } from "@ledgerhq/types-live";
import type { AleoAccount, AleoResources } from "@ledgerhq/coin-aleo/types";
import { BigNumber } from "bignumber.js";

type BalanceType = "public" | "private";

type BalanceSelectorProps = {
  account: Account;
  selectedType: BalanceType;
  onChange: (type: BalanceType) => void;
};

export function BalanceSelector({ account, selectedType, onChange }: BalanceSelectorProps) {
  const aleoAccount = account as AleoAccount;
  const aleoResources = aleoAccount.aleoResources as AleoResources | undefined;

  const publicBalance = aleoAccount.spendableBalance || new BigNumber(0);
  const privateBalance = aleoResources?.privateBalance || new BigNumber(0);
  const lastPrivateSync = aleoResources?.lastPrivateSyncDate;

  return (
    <Flex flexDirection="row" alignItems="stretch" gap={3} mb={4} style={styles.container}>
      <BalanceOption
        label="Public balance"
        balance={publicBalance}
        unit={account.unit}
        selected={selectedType === "public"}
        onPress={() => onChange("public")}
      />
      <BalanceOption
        label="Private balance"
        balance={privateBalance}
        unit={account.unit}
        selected={selectedType === "private"}
        onPress={() => onChange("private")}
        lastSyncDate={lastPrivateSync}
      />
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
