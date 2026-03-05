/**
 * Bitcoin RBF edit transaction summary (cancel / speed up).
 */

import {
  getEditTransactionStatus,
  type GetEditTransactionStatusParams,
} from "@ledgerhq/coin-bitcoin/editTransaction/index";
import { getOriginalTxFeeRateSatVb } from "@ledgerhq/coin-bitcoin/rbfHelpers";
import type {
  Transaction as BtcTransaction,
  TransactionStatus,
} from "@ledgerhq/coin-bitcoin/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { useTheme } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "~/context/Locale";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import ConfirmationModal from "~/components/ConfirmationModal";
import LText from "~/components/LText";
import NavigationScrollView from "~/components/NavigationScrollView";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SectionSeparator from "~/components/SectionSeparator";
import SendRowsCustom from "~/components/SendRowsCustom";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import AlertTriangle from "~/icons/AlertTriangle";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import SummaryAmountSection from "~/screens/SendFunds/SummaryAmountSection";
import SummaryFromSection from "~/screens/SendFunds/SummaryFromSection";
import SummaryToSection from "~/screens/SendFunds/SummaryToSection";
import SummaryTotalSection from "~/screens/SendFunds/SummaryTotalSection";
import BitcoinSendRowsFee from "~/families/bitcoin/SendRowsFee";
import type { BitcoinEditTransactionParamList } from "./EditTransactionParamList";

type Navigation = BaseComposite<
  StackNavigatorProps<BitcoinEditTransactionParamList, ScreenName.EditTransactionSummary>
>;

type Props = Navigation;

function BitcoinEditTransactionSummary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { nextNavigation, overrideAmountLabel, transactionRaw, editType } = route.params;

  const { account, parentAccount } = useAccountScreen(route);
  invariant(account, "account is missing");
  invariant(transactionRaw, "transactionRaw is missing");

  const mainAccount = getMainAccount(account, parentAccount);

  const {
    transaction,
    setTransaction,
    status: txStatus,
    bridgePending,
  } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));

  const transactionToUpdate = useMemo<BtcTransaction>(
    () => fromTransactionRaw(transactionRaw) as BtcTransaction,
    [transactionRaw],
  );

  const [originalFeePerByte, setOriginalFeePerByte] = useState<BigNumber | null>(null);

  // When transactionToUpdate.feePerByte is missing (e.g. not stored in operation), fetch original tx fee rate for RBF validation
  useEffect(() => {
    const replaceTxId = transactionToUpdate.replaceTxId;
    const hasFeePerByte =
      transactionToUpdate.feePerByte != null && !transactionToUpdate.feePerByte.isNaN();

    if (!replaceTxId || hasFeePerByte) {
      setOriginalFeePerByte(null);
      return;
    }

    let cancelled = false;
    getOriginalTxFeeRateSatVb(mainAccount, replaceTxId).then((fee: BigNumber | null) => {
      if (!cancelled) {
        setOriginalFeePerByte(fee);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mainAccount, transactionToUpdate.replaceTxId, transactionToUpdate.feePerByte]);

  const statusParams: GetEditTransactionStatusParams = {
    editType,
    transaction: transaction as BtcTransaction,
    transactionToUpdate,
    status: txStatus as TransactionStatus,
    ...(originalFeePerByte != null ? { originalFeePerByte } : {}),
  };

  const status = getEditTransactionStatus(statusParams);

  invariant(transaction, "transaction is missing");

  useTransactionChangeFromNavigation(setTransaction);

  const [highFeesOpen, setHighFeesOpen] = useState(false);

  const navigateToNext = useCallback(() => {
    if (!nextNavigation) {
      return;
    }
    return (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      nextNavigation,
      {
        ...route.params,
        transaction,
        status,
        selectDeviceLink: true,
      },
    );
  }, [navigation, nextNavigation, route.params, transaction, status]);

  const onAcceptFees = useCallback(() => {
    setHighFeesOpen(false);
    navigateToNext();
  }, [navigateToNext]);
  const onRejectFees = useCallback(() => {
    setHighFeesOpen(false);
  }, []);

  const { amount, totalSpent, errors, warnings } = status;

  const firstError = errors[Object.keys(errors)[0]];

  const currencyOrToken = getAccountCurrency(account);

  const hasNonEmptySubAccounts =
    account.type === "Account" &&
    (account.subAccounts || []).some(subAccount => subAccount.balance.gt(0));

  const onContinue = useCallback(() => {
    if (warnings.feeTooHigh) {
      setHighFeesOpen(true);
      return;
    }
    navigateToNext();
  }, [navigateToNext, warnings.feeTooHigh]);

  if (!transaction.recipient) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="SendFunds" name="Summary" currencyName={currencyOrToken?.name} />
      <NavigationScrollView style={styles.body}>
        {transaction.useAllAmount && hasNonEmptySubAccounts ? (
          <View style={styles.infoBox}>
            <Alert type="primary">
              <Trans
                i18nKey="send.summary.subaccountsWarning"
                values={{
                  currency: currencyOrToken?.name,
                }}
              />
            </Alert>
          </View>
        ) : null}
        <SummaryFromSection account={mainAccount} parentAccount={undefined} />
        <View style={[styles.verticalConnector, { borderColor: colors.lightFog }]} />
        <SummaryToSection transaction={transaction} currency={mainAccount.currency} />
        {warnings.recipient ? (
          <LText style={styles.warning} color="orange">
            <TranslatedError error={warnings.recipient} />
          </LText>
        ) : null}
        <SendRowsCustom
          transaction={transaction}
          account={mainAccount}
          navigation={navigation as never}
          route={route as never}
        />
        <SectionSeparator lineColor={colors.lightFog} />

        <SummaryAmountSection
          account={mainAccount}
          parentAccount={undefined}
          amount={amount}
          overrideAmountLabel={overrideAmountLabel}
        />

        <BitcoinSendRowsFee
          setTransaction={setTransaction}
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          navigation={navigation as never}
          route={route as never}
        />

        {!amount.eq(totalSpent) ? (
          <>
            <SectionSeparator lineColor={colors.lightFog} />
            <SummaryTotalSection
              account={mainAccount}
              parentAccount={undefined}
              amount={totalSpent}
            />
          </>
        ) : null}
      </NavigationScrollView>
      <View style={styles.footer}>
        <LText style={styles.error} color="alert">
          <TranslatedError error={firstError} />
        </LText>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={() => onContinue()}
          disabled={bridgePending || !!firstError}
          pending={bridgePending}
        />
      </View>
      <ConfirmationModal
        isOpened={highFeesOpen}
        onClose={onRejectFees}
        onConfirm={onAcceptFees}
        Icon={AlertTriangle}
        confirmationDesc={
          <Trans i18nKey="send.highFeeModal">
            {"Be careful, your fees represent more than "}
            <LText color="smoke" bold>
              10%
            </LText>
            {" of the amount. Do you want to continue?"}
          </Trans>
        }
        confirmButtonText={<Trans i18nKey="common.continue" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  infoBox: {
    marginTop: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
  error: {
    fontSize: 12,
    marginBottom: 5,
  },
  warning: {
    fontSize: 14,
    marginBottom: 16,
    paddingLeft: 50,
  },
  verticalConnector: {
    position: "absolute",
    borderLeftWidth: 2,
    height: 20,
    top: 60,
    left: 16,
  },
});

export default BitcoinEditTransactionSummary;
