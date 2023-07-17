import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useState, useCallback, Component, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import { isNftTransaction } from "@ledgerhq/live-common/nft/index";
import { isEditableOperation } from "@ledgerhq/coin-framework/operation";
import { NotEnoughGas, TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { useNavigation, useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { isCurrencySupported } from "@ledgerhq/coin-framework/currencies/index";
import { getTransactionByHash } from "@ledgerhq/coin-evm/api/transaction";

import { NavigatorName, ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import NavigationScrollView from "../../../components/NavigationScrollView";
import Alert from "../../../components/Alert";
import SummaryFromSection from "../../../screens/SendFunds/SummaryFromSection";
import SummaryToSection from "../../../screens/SendFunds/SummaryToSection";
import LText from "../../../components/LText";
import SectionSeparator from "../../../components/SectionSeparator";
import SummaryNft from "../../../screens/SendFunds/SummaryNft";
import SummaryAmountSection from "../../../screens/SendFunds/SummaryAmountSection";
import TranslatedError from "../../../components/TranslatedError";
import SendRowsFee from "../../../components/SendRowsFee";
import SendRowsCustom from "../../../components/SendRowsCustom";
import Info from "../../../icons/Info";
import SummaryTotalSection from "../../../screens/SendFunds/SummaryTotalSection";
import Button from "../../../components/Button";
import ConfirmationModal from "../../../components/ConfirmationModal";
import AlertTriangle from "../../../icons/AlertTriangle";
import TooMuchUTXOBottomModal from "../../../screens/SendFunds/TooMuchUTXOBottomModal";
import { CurrentNetworkFee } from "../CurrentNetworkFee";
import { useTransactionChangeFromNavigation } from "../../../logic/screenTransactionHooks";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EditTransactionSummary({ navigation, route }: any) {
  const { colors } = useTheme();
  const { nextNavigation, overrideAmountLabel, hideTotal, operation } = route.params;

  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account is missing");

  const { transaction, setTransaction, status, bridgePending } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));

  invariant(transaction, "transaction is missing");

  const isNFTSend = isNftTransaction(transaction);
  // handle any edit screen changes like fees changes
  useTransactionChangeFromNavigation(setTransaction);
  const [continuing, setContinuing] = useState(false);
  const [highFeesOpen, setHighFeesOpen] = useState(false);
  const [highFeesWarningPassed, setHighFeesWarningPassed] = useState(false);
  const [utxoWarningOpen, setUtxoWarningOpen] = useState(false);
  const [utxoWarningPassed, setUtxoWarningPassed] = useState(false);
  const navigateToNext = useCallback(() => {
    if (!nextNavigation) return null;
    return (
      // This component is used in a wild bunch of navigators.
      // nextNavigation is a param which can have too many shapes
      // Unfortunately for this reason let's keep it untyped for now.
      navigation.navigate(nextNavigation, {
        ...route.params,
        transaction,
        status,
        selectDeviceLink: true,
      })
    );
  }, [navigation, nextNavigation, route.params, transaction, status]);
  useEffect(() => {
    if (!continuing) {
      return;
    }
    const { warnings } = status;

    if (Object.keys(warnings).includes("feeTooHigh") && !highFeesWarningPassed) {
      setHighFeesOpen(true);
      return;
    }

    setContinuing(false);
    setUtxoWarningPassed(false);
    setHighFeesWarningPassed(false);
    navigateToNext();
  }, [status, continuing, highFeesWarningPassed, account, utxoWarningPassed, navigateToNext]);
  const onPassUtxoWarning = useCallback(() => {
    setUtxoWarningOpen(false);
    setUtxoWarningPassed(true);
  }, []);
  const onRejectUtxoWarning = useCallback(() => {
    setUtxoWarningOpen(false);
    setContinuing(false);
  }, []);
  const onAcceptFees = useCallback(() => {
    setHighFeesOpen(false);
    setHighFeesWarningPassed(true);
  }, []);
  const onRejectFees = useCallback(() => {
    setHighFeesOpen(false);
    setContinuing(false);
  }, [setHighFeesOpen]);
  const { amount, totalSpent, errors } = status;
  const { transaction: transactionError } = errors;
  const error = errors[Object.keys(errors)[0]];
  const mainAccount = getMainAccount(account, parentAccount);
  const currencyOrToken = getAccountCurrency(account);
  const hasNonEmptySubAccounts =
    account &&
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorNavigation = useNavigation<any>();
  const editableOperation = operation && isEditableOperation(account, operation);

  if (editableOperation) {
    getTransactionByHash(mainAccount.currency, operation?.hash || "").then(tx => {
      if (tx?.confirmations) {
        errorNavigation.navigate(ScreenName.TransactionAlreadyValidatedError, {
          error: new TransactionHasBeenValidatedError(
            "The transaction has already been validated. You can't cancel or speedup a validated transaction.",
          ),
        });
      }
    });
  }

  // FIXME: why is recipient sometimes empty?
  if (!account || !transaction || !transaction.recipient || !currencyOrToken) {
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
        <SummaryFromSection account={account} parentAccount={parentAccount} />
        <VerticalConnector
          style={[
            styles.verticalConnector,
            {
              borderColor: colors.lightFog,
            },
          ]}
        />
        <SummaryToSection transaction={transaction} currency={mainAccount.currency} />
        {status.warnings.recipient ? (
          <LText style={styles.warning} color="orange">
            <TranslatedError error={status.warnings.recipient} />
          </LText>
        ) : null}
        <SendRowsCustom
          transaction={transaction}
          account={mainAccount}
          navigation={navigation}
          route={route}
        />
        <SectionSeparator lineColor={colors.lightFog} />
        {isNFTSend ? (
          <SummaryNft transaction={transaction} currencyId={(account as Account).currency.id} />
        ) : (
          <SummaryAmountSection
            account={account}
            parentAccount={parentAccount}
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
          navigation={navigation}
          route={route}
        />

        {editableOperation ? (
          <CurrentNetworkFee
            account={account}
            parentAccount={parentAccount}
            transactionRaw={operation.transactionRaw}
          />
        ) : null}

        {error ? (
          <View style={styles.gasPriceError}>
            <View
              style={{
                padding: 4,
              }}
            >
              <Info size={12} color={colors.alert} />
            </View>
            <LText style={[styles.error, styles.gasPriceErrorText]}>
              <TranslatedError error={error} />
            </LText>
          </View>
        ) : null}
        {!amount.eq(totalSpent) && !hideTotal ? (
          <>
            <SectionSeparator lineColor={colors.lightFog} />
            <SummaryTotalSection
              account={account}
              parentAccount={parentAccount}
              amount={totalSpent}
            />
          </>
        ) : null}
      </NavigationScrollView>
      <View style={styles.footer}>
        <LText style={styles.error} color="alert">
          <TranslatedError error={transactionError} />
        </LText>
        {error && error instanceof NotEnoughGas ? (
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
            onPress={() => setContinuing(true)}
            disabled={bridgePending || !!transactionError}
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
      <TooMuchUTXOBottomModal
        isOpened={utxoWarningOpen}
        onPress={onPassUtxoWarning}
        onClose={() => onRejectUtxoWarning()}
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
