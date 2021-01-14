/* @flow */
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type {
  Transaction,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { ScreenName } from "../../../../const";
import { TrackScreen } from "../../../../analytics";
import Button from "../../../../components/Button";
import KeyboardView from "../../../../components/KeyboardView";
import RetryButton from "../../../../components/RetryButton";
import CancelButton from "../../../../components/CancelButton";
import GenericErrorBottomModal from "../../../../components/GenericErrorBottomModal";
import AmountInput from "../../../SendFunds/AmountInput";
import LText from "../../../../components/LText";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  currency: TokenCurrency,
};

export default function SendAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { currency } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(
    account && account.type === "TokenAccount",
    "token account required",
  );
  const bridge = getAccountBridge(account, parentAccount);

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));

  const onChange = useCallback(
    amount => {
      if (!amount.isNaN()) {
        setTransaction(bridge.updateTransaction(transaction, { amount }));
      }
    },
    [setTransaction, bridge, transaction],
  );

  const onContinue = useCallback(() => {
    navigation.replace(ScreenName.LendingEnableAmountAdvanced, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction]);

  const onBridgeErrorCancel = useCallback(() => {
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    if (!transaction) return;
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);

  const blur = useCallback(() => Keyboard.dismiss(), []);

  if (!transaction) return null;

  const { spendableBalance } = account;
  const { useAllAmount, amount } = transaction;
  const unit = getAccountUnit(account);

  return (
    <>
      <TrackScreen
        category="Lend Approve"
        name="step 1 (Amount)"
        eventProperties={{ currencyName: currency.name }}
      />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={styles.amountWrapper}>
              <AmountInput
                editable={!useAllAmount}
                account={account}
                onChange={onChange}
                currency={unit.code}
                value={amount}
                error={status.errors.amount}
                warning={status.warnings.amount}
              />

              <View style={styles.bottomWrapper}>
                <View style={styles.available}>
                  <View style={styles.availableLeft}>
                    <LText color="grey">
                      <Trans i18nKey="transfer.lending.enable.amount.totalAvailable" />
                    </LText>
                    <LText semiBold>
                      <CurrencyUnitValue
                        showCode
                        unit={unit}
                        value={spendableBalance}
                      />
                    </LText>
                  </View>
                </View>
                <View style={styles.continueWrapper}>
                  <Button
                    event="SendAmountContinue"
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
                    disabled={!!status.errors.amount || bridgePending}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>

      <GenericErrorBottomModal
        error={bridgeError}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton
              containerStyle={styles.button}
              onPress={onBridgeErrorCancel}
            />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
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
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  amountWrapper: {
    flex: 1,
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
    fontSize: 16,
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
});
