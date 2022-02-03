/* @flow */
import React, { useCallback, useEffect } from "react";
import { View, StyleSheet, Switch, Text, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";

import { ScreenName } from "../../const";
import LText from "../../components/LText";
import Alert from "../../components/Alert";
import CurrencyInput from "../../components/CurrencyInput";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Touchable from "../../components/Touchable";
import Button from "../../components/Button";
import TranslatedError from "../../components/TranslatedError";
import InfoIcon from "../../icons/Info";

import AmountInput from "../../screens/SendFunds/AmountInput";

export default function StellarSendAmountCoin({
  navigation,
  account,
  parentAccount,
  transaction,
  status,
  setTransaction,
  openInfoModal,
  bridgePending,
  toggleUseAllAmount,
  useAllAmount,
  unit,
  maxSpendable,
}: any) {
  const { colors } = useTheme();
  const mainAccount = getMainAccount(account, parentAccount);

  const updateTransaction = useCallback(
    params => {
      if (!account) return;
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(bridge.updateTransaction(transaction, params));
    },
    [account, parentAccount, setTransaction, transaction],
  );

  useEffect(() => {
    // Setting asset code and asset issuer for non-native assets
    if (transaction?.subAccountId) {
      const [assetCode, assetIssuer] = transaction.subAccountId
        .split("+")[1]
        .split(":");

      if (!transaction.assetCode && !transaction.assetIssuer) {
        updateTransaction({ assetCode, assetIssuer });
      }
    }
  }, [
    transaction.assetCode,
    transaction.assetIssuer,
    transaction.subAccountId,
    updateTransaction,
  ]);

  const onAmountChange = useCallback(
    amount => {
      if (!amount.isNaN()) {
        updateTransaction({ amount });
      }
    },
    [updateTransaction],
  );

  const onFeeValueChange = useCallback(
    fees => {
      updateTransaction({ fees });
    },
    [updateTransaction],
  );

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [account, parentAccount, navigation, transaction]);

  const { networkCongestionLevel, fees: recommendedFee } =
    transaction?.networkInfo || {};

  const getCongestionColor = (level: string) => {
    switch (level) {
      case "LOW":
        return colors.success;
      case "MEDIUM":
        return colors.orange;
      // HIGH
      default:
        return colors.alert;
    }
  };

  return (
    <View style={styles.amountFieldsWrapper}>
      <ScrollView style={styles.scroll}>
        <View style={styles.amountContainer}>
          <AmountInput
            editable={!useAllAmount}
            account={account}
            onChange={onAmountChange}
            value={status.amount}
            error={
              status.amount.eq(0) &&
              (bridgePending || !transaction.useAllAmount)
                ? null
                : status.errors.amount
            }
            warning={status.warnings.amount || status.warnings.transaction}
          />
        </View>

        <View style={styles.feeContainer}>
          <Text style={styles.feeTitle}>
            <Trans i18nKey="stellar.fee" />
          </Text>
          <Text
            style={[
              styles.feeInfoRow,
              {
                color: getCongestionColor(networkCongestionLevel),
              },
            ]}
          >
            <Trans
              i18nKey={`stellar.networkCongestionLevel.${networkCongestionLevel}`}
            />{" "}
            <Trans i18nKey="stellar.networkCongestion" />
          </Text>
          <Text style={styles.feeInfoRow}>
            <Trans i18nKey="stellar.recommendedFee" />{" "}
            <CurrencyUnitValue
              showCode
              unit={mainAccount.unit}
              value={recommendedFee}
            />
          </Text>

          <View style={styles.feeWrapper}>
            <CurrencyInput
              editable
              isActive
              onChange={onFeeValueChange}
              unit={mainAccount.unit}
              value={transaction.fees}
              renderRight={
                <LText
                  style={[styles.currency, styles.active]}
                  semiBold
                  color="grey"
                >
                  {mainAccount.unit.code}
                </LText>
              }
              hasError={!!status.errors.transaction}
              hasWarning={!!status.warnings.transaction}
            />
            <LText
              style={[
                status.errors.transaction ? styles.error : styles.warning,
              ]}
              color={status.errors.transaction ? "alert" : "orange"}
              numberOfLines={2}
            >
              <TranslatedError
                error={status.errors.transaction || status.warnings.transaction}
              />
            </LText>
          </View>
        </View>

        {status.warnings?.transaction?.name ===
        "StellarFeeSmallerThanRecommended" ? (
          <View style={styles.infoBox}>
            <Alert type="warning">
              <Trans i18nKey="stellar.recommenndedFeeInfo" />
            </Alert>
          </View>
        ) : null}

        {status.errors.nativeBalance ? (
          <View style={styles.infoBox}>
            <Alert type="error">
              <TranslatedError error={status.errors.nativeBalance} />
            </Alert>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomWrapper}>
        <View style={[styles.available]}>
          <Touchable
            style={styles.availableLeft}
            event={"MaxSpendableInfo"}
            onPress={() => openInfoModal("maxSpendable")}
          >
            <View>
              <LText color="grey">
                <Trans i18nKey="send.amount.available" />{" "}
                <InfoIcon size={12} color="grey" />
              </LText>
              {maxSpendable && (
                <LText semiBold color="grey">
                  <CurrencyUnitValue
                    showCode
                    unit={unit}
                    value={maxSpendable}
                  />
                </LText>
              )}
            </View>
          </Touchable>
          {typeof useAllAmount === "boolean" ? (
            <View style={styles.availableRight}>
              <LText style={styles.maxLabel} color="grey">
                <Trans i18nKey="send.amount.useMax" />
              </LText>
              <Switch
                style={styles.switch}
                value={useAllAmount}
                onValueChange={toggleUseAllAmount}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.continueWrapper}>
          <Button
            event="SendAmountCoinContinue"
            type="primary"
            title={
              <Trans
                i18nKey={
                  !bridgePending
                    ? "common.continue"
                    : "send.amount.loadingNetwork"
                }
              />
            }
            onPress={onContinue}
            disabled={
              status.amount.lte(0) ||
              !!status.errors.amount ||
              !!status.errors.nativeBalance ||
              !!status.errors.transaction ||
              bridgePending
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
    marginBottom: 16,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableLeft: {
    justifyContent: "center",
    flexGrow: 1,
  },
  maxLabel: {
    marginRight: 4,
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  amountFieldsWrapper: {
    flex: 1,
  },
  switch: {
    opacity: 0.99,
  },
  infoBox: {
    marginVertical: 24,
    flex: 1,
  },
  feeWrapper: {
    flexBasis: 100,
    flexShrink: 0,
    flexDirection: "column",
    justifyContent: "center",
  },
  currency: {
    fontSize: 24,
  },
  active: {
    fontSize: 32,
  },
  error: {
    fontSize: 14,
  },
  warning: {
    fontSize: 14,
  },
  amountContainer: {
    flex: 0.6,
    marginBottom: 24,
  },
  feeContainer: {
    flex: 1,
  },
  feeTitle: {
    marginBottom: 16,
    fontSize: 20,
  },
  feeInfoRow: {
    marginBottom: 6,
    fontSize: 16,
  },
});
