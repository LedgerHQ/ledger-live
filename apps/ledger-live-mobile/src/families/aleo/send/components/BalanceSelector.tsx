import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import type { AleoAccount, Transaction } from "@ledgerhq/coin-aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import { isPrivateTransaction } from "@ledgerhq/coin-aleo/logic/utils";
import { initializePrivateProperties } from "../utils";

type BalanceType = "public" | "private";

interface BalanceSelectorProps {
  account: AleoAccount;
  transaction: Transaction;
  onChange: (transaction: Transaction) => void;
}

const PRIVATE_BALANCE_PLACEHOLDER = "***";

export function BalanceSelector({
  account,
  transaction,
  onChange,
}: BalanceSelectorProps) {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);

  const isPrivateSelected = isPrivateTransaction(transaction);
  const selectedType: BalanceType = isPrivateSelected ? "private" : "public";

  const privateBalance = account.aleoResources?.privateBalance ?? null;
  const transparentBalance = account.aleoResources?.transparentBalance;

  const formattedPrivateBalance =
    privateBalance !== null
      ? formatCurrencyUnit(unit, privateBalance, {
          showCode: true,
          disableRounding: true,
        })
      : PRIVATE_BALANCE_PLACEHOLDER;

  const formattedTransparentBalance = formatCurrencyUnit(
    unit,
    transparentBalance,
    {
      showCode: true,
      disableRounding: true,
    },
  );

  const handleSelectPublic = useCallback(() => {
    if (selectedType === "public") return;

    // Switch to public mode and clear private properties
    const updatedTransaction: Transaction = {
      ...transaction,
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      properties: undefined,
    };

    onChange(updatedTransaction);
  }, [transaction, onChange, selectedType]);

  const handleSelectPrivate = useCallback(() => {
    if (selectedType === "private") return;

    // Switch to private mode and initialize properties
    const updatedTransaction: Transaction = {
      ...transaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: initializePrivateProperties(),
    };

    onChange(updatedTransaction);
  }, [transaction, onChange, selectedType]);

  const lastSyncDate = account.aleoResources?.lastPrivateSyncDate;
  const syncDateText = lastSyncDate
    ? t("aleo.send.balanceSelector.lastSync", {
        date: new Date(lastSyncDate).toLocaleString(),
      })
    : t("aleo.send.balanceSelector.notSynced");

  return (
    <Flex flexDirection="column" rowGap={8} mt={6}>
      <Text variant="paragraphLineHeight" fontWeight="semiBold" color="neutral.c70">
        {t("aleo.send.balanceSelector.label")}
      </Text>

      <Flex flexDirection="column" rowGap={3}>
        {/* Public Balance Option */}
        <TouchableOpacity
          onPress={handleSelectPublic}
          style={[
            styles.optionButton,
            selectedType === "public" && styles.optionButtonSelected,
          ]}
        >
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            p={4}
          >
            <Text
              variant="paragraph"
              fontWeight="medium"
              color={selectedType === "public" ? "primary.c80" : "neutral.c80"}
            >
              {t("aleo.send.balanceSelector.public")}
            </Text>
            <Text
              variant="paragraph"
              fontWeight="semiBold"
              color={selectedType === "public" ? "primary.c80" : "neutral.c100"}
            >
              {formattedTransparentBalance}
            </Text>
          </Flex>
        </TouchableOpacity>

        {/* Private Balance Option */}
        <TouchableOpacity
          onPress={handleSelectPrivate}
          style={[
            styles.optionButton,
            selectedType === "private" && styles.optionButtonSelected,
          ]}
        >
          <Flex flexDirection="column" p={4} rowGap={2}>
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text
                variant="paragraph"
                fontWeight="medium"
                color={selectedType === "private" ? "primary.c80" : "neutral.c80"}
              >
                {t("aleo.send.balanceSelector.private")}
              </Text>
              <Text
                variant="paragraph"
                fontWeight="semiBold"
                color={selectedType === "private" ? "primary.c80" : "neutral.c100"}
              >
                {formattedPrivateBalance}
              </Text>
            </Flex>
            {privateBalance !== null && (
              <Text variant="small" color="neutral.c70">
                {syncDateText}
              </Text>
            )}
          </Flex>
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
}

const styles = StyleSheet.create({
  optionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  optionButtonSelected: {
    borderColor: "#6490F1",
    backgroundColor: "#F0F4FF",
  },
});
