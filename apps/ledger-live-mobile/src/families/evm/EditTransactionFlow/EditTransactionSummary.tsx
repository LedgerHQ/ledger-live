/**
 * NOTE: this is a copy of the original
 * apps/ledger-live-mobile/src/screens/SendFunds/04-Summary.tsx file,
 * with some changes to make it work with our custom flow
 */

import { getEditTransactionStatus } from "@ledgerhq/coin-evm/editTransaction/index";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { isCurrencySupported } from "@ledgerhq/coin-framework/currencies/index";
import { NotEnoughGas } from "@ledgerhq/errors";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { isNftTransaction } from "@ledgerhq/live-common/nft/index";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import invariant from "invariant";
import React, { Component, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import ConfirmationModal from "~/components/ConfirmationModal";
import LText from "~/components/LText";
import NavigationScrollView from "~/components/NavigationScrollView";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SectionSeparator from "~/components/SectionSeparator";
import SendRowsCustom from "~/components/SendRowsCustom";
import SendRowsFee from "~/components/SendRowsFee";
import TranslatedError from "~/components/TranslatedError";
import { NavigatorName, ScreenName } from "~/const";
import AlertTriangle from "~/icons/AlertTriangle";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import { accountScreenSelector } from "~/reducers/accounts";
import SummaryAmountSection from "~/screens/SendFunds/SummaryAmountSection";
import SummaryFromSection from "~/screens/SendFunds/SummaryFromSection";
import SummaryNft from "~/screens/SendFunds/SummaryNft";
import SummaryToSection from "~/screens/SendFunds/SummaryToSection";
import SummaryTotalSection from "~/screens/SendFunds/SummaryTotalSection";
import { CurrentNetworkFee } from "../CurrentNetworkFee";
import { EditTransactionParamList } from "./EditTransactionParamList";

type Navigation = BaseComposite<
  StackNavigatorProps<EditTransactionParamList, ScreenName.EditTransactionSummary>
>;

type Props = Navigation;

function EditTransactionSummary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { nextNavigation, overrideAmountLabel, transactionRaw, editType } = route.params;

  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account is missing");
  invariant(transactionRaw, "transactionRaw is missing");

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

  const transactionToUpdate = fromTransactionRaw(transactionRaw) as EvmTransaction;

  const status = getEditTransactionStatus({
    transaction: transaction as EvmTransaction,
    transactionToUpdate,
    status: txStatus,
    editType,
  });

  invariant(transaction, "transaction is missing");

  const isNFTSend = isNftTransaction(transaction);

  // handle any edit screen changes like fees changes
  useTransactionChangeFromNavigation(setTransaction);

  const [highFeesOpen, setHighFeesOpen] = useState(false);

  const navigateToNext = useCallback(() => {
    if (!nextNavigation) {
      return;
    }
    return (
      // This component is used in a wild bunch of navigators.
      // nextNavigation is a param which can have too many shapes
      // Unfortunately for this reason let's keep it untyped for now.
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(nextNavigation, {
        ...route.params,
        transaction,
        status,
        selectDeviceLink: true,
      })
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

  const mainAccount = getMainAccount(account, parentAccount);
  const currencyOrToken = getAccountCurrency(account);

  const hasNonEmptySubAccounts =
    account.type === "Account" &&
    (account.subAccounts || []).some(subAccount => subAccount.balance.gt(0));

  const onBuyEth = useCallback(() => {
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultAccountId: account?.id,
        defaultCurrencyId: currencyOrToken?.id,
      },
    });
  }, [navigation, account?.id, currencyOrToken?.id]);

  const onContinue = useCallback(() => {
    if (warnings.feeTooHigh) {
      setHighFeesOpen(true);
      return;
    }
    navigateToNext();
  }, [navigateToNext, warnings.feeTooHigh]);

  // FIXME: why is recipient sometimes empty?
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
        <VerticalConnector
          style={[
            styles.verticalConnector,
            {
              borderColor: colors.lightFog,
            },
          ]}
        />
        <SummaryToSection transaction={transaction} currency={mainAccount.currency} />
        {warnings.recipient ? (
          <LText style={styles.warning} color="orange">
            <TranslatedError error={warnings.recipient} />
          </LText>
        ) : null}
        <SendRowsCustom
          transaction={transaction}
          account={mainAccount}
          // FIXME: fix typing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          navigation={navigation as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          route={route as any}
        />
        <SectionSeparator lineColor={colors.lightFog} />
        {isNFTSend ? (
          <SummaryNft transaction={transaction} currencyId={(account as Account).currency.id} />
        ) : (
          <SummaryAmountSection
            account={mainAccount}
            parentAccount={undefined}
            amount={amount}
            overrideAmountLabel={overrideAmountLabel}
          />
        )}
        <SendRowsFee
          setTransaction={setTransaction}
          status={status}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          // FIXME: fix typing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          navigation={navigation as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          route={route as any}
          transactionToUpdate={transactionToUpdate}
        />

        <CurrentNetworkFee
          account={account}
          parentAccount={parentAccount}
          transactionRaw={transactionRaw}
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
        {firstError && firstError instanceof NotEnoughGas ? (
          isCurrencySupported(currencyOrToken as CryptoCurrency) && (
            <Button
              event="SummaryBuyEth"
              type="primary"
              title={<Trans i18nKey="common.buyEth" />}
              containerStyle={styles.continueButton}
              onPress={onBuyEth}
            />
          )
        ) : (
          <Button
            event="SummaryContinue"
            type="primary"
            title={<Trans i18nKey="common.continue" />}
            containerStyle={styles.continueButton}
            onPress={() => onContinue()}
            disabled={bridgePending || !!firstError}
            pending={bridgePending}
          />
        )}
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
  gasPriceError: {
    marginTop: 16,
    flexDirection: "row",
  },
  gasPriceErrorText: {
    paddingLeft: 4,
    fontSize: 14,
  },
});

class VerticalConnector extends Component<{
  style: Record<string, string | number> | Array<Record<string, string | number>>;
}> {
  render() {
    const { style } = this.props;
    return <View style={style} />;
  }
}

export default EditTransactionSummary;
