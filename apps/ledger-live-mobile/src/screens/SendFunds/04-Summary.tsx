import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useState, useCallback, Component, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import {
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import type { TransactionStatus as BitcoinTransactionStatus } from "@ledgerhq/live-common/families/bitcoin/types";
import { isNftTransaction } from "@ledgerhq/live-common/nft/index";
import { NotEnoughGas } from "@ledgerhq/errors";
import { useTheme } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName, NavigatorName } from "../../const";
import { TrackScreen } from "../../analytics";
import { useTransactionChangeFromNavigation } from "../../logic/screenTransactionHooks";
import Button from "../../components/Button";
import LText from "../../components/LText";
import Alert from "../../components/Alert";
import TranslatedError from "../../components/TranslatedError";
import SendRowsCustom from "../../components/SendRowsCustom";
import SendRowsFee from "../../components/SendRowsFee";
import SummaryFromSection from "./SummaryFromSection";
import SummaryToSection from "./SummaryToSection";
import SummaryAmountSection from "./SummaryAmountSection";
import SummaryNft from "./SummaryNft";
import SummaryTotalSection from "./SummaryTotalSection";
import SectionSeparator from "../../components/SectionSeparator";
import AlertTriangle from "../../icons/AlertTriangle";
import ConfirmationModal from "../../components/ConfirmationModal";
import NavigationScrollView from "../../components/NavigationScrollView";
import Info from "../../icons/Info";
import TooMuchUTXOBottomModal from "./TooMuchUTXOBottomModal";
import { isCurrencySupported } from "../Exchange/coinifyConfig";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Navigation = BaseComposite<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<
      LendingEnableFlowParamsList,
      ScreenName.LendingEnableSummary
    >
  | StackNavigatorProps<
      LendingSupplyFlowNavigatorParamList,
      ScreenName.LendingSupplySummary
    >
  | StackNavigatorProps<
      LendingWithdrawFlowNavigatorParamList,
      ScreenName.LendingWithdrawSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = Navigation;

const WARN_FROM_UTXO_COUNT = 50;

function SendSummary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { nextNavigation, overrideAmountLabel, hideTotal } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { transaction, setTransaction, status, bridgePending } =
    useBridgeTransaction(() => ({
      transaction: route.params.transaction,
      account,
      parentAccount,
    }));
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
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(
        nextNavigation,
        {
          ...route.params,
          transaction,
          status,
          selectDeviceLink: true,
        },
      )
    );
  }, [navigation, nextNavigation, route.params, transaction, status]);
  useEffect(() => {
    if (!continuing) {
      return;
    }
    // FIXME: NOT SURE BITCOIN TRANSACTION STATUS IS CORRECT HERE
    //  BUT WE TYPE LIKE ANIMALS SO...
    const { warnings, txInputs } = status as BitcoinTransactionStatus;

    if (
      Object.keys(warnings).includes("feeTooHigh") &&
      !highFeesWarningPassed
    ) {
      setHighFeesOpen(true);
      return;
    }

    if (
      txInputs &&
      txInputs.length >= WARN_FROM_UTXO_COUNT &&
      !utxoWarningPassed
    ) {
      const to = setTimeout(
        () => setUtxoWarningOpen(true), // looks like you can not open close a bottom modal
        // and open another one very fast
        highFeesWarningPassed ? 1000 : 0,
      );
      // eslint-disable-next-line consistent-return
      return () => clearTimeout(to);
    }

    setContinuing(false);
    setUtxoWarningPassed(false);
    setHighFeesWarningPassed(false);
    navigateToNext();
  }, [
    status,
    continuing,
    highFeesWarningPassed,
    account,
    utxoWarningPassed,
    navigateToNext,
  ]);
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
  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = account && getAccountCurrency(account);
  const hasNonEmptySubAccounts =
    account &&
    account.type === "Account" &&
    (account.subAccounts || []).some(subAccount => subAccount.balance.gt(0));
  const onBuyEth = useCallback(() => {
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultAccountId: account?.id,
        defaultCurrencyId: currency?.id,
      },
    });
  }, [navigation, account?.id, currency?.id]);
  // FIXME: why is recipient sometimes empty?
  if (!account || !transaction || !transaction.recipient || !currency)
    return null;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="SendFunds"
        name="Summary"
        currencyName={currency?.name}
      />
      <NavigationScrollView style={styles.body}>
        {transaction.useAllAmount && hasNonEmptySubAccounts ? (
          <View style={styles.infoBox}>
            <Alert type="primary">
              <Trans
                i18nKey="send.summary.subaccountsWarning"
                values={{
                  currency: currency?.name,
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
        <SummaryToSection recipient={transaction.recipient} />
        {status.warnings.recipient ? (
          <LText style={styles.warning} color="orange">
            <TranslatedError error={status.warnings.recipient} />
          </LText>
        ) : null}
        <SendRowsCustom
          transaction={transaction}
          account={mainAccount as Account}
          navigation={navigation}
          route={route}
        />
        <SectionSeparator lineColor={colors.lightFog} />
        {isNFTSend ? (
          <SummaryNft
            transaction={transaction}
            currencyId={(account as Account).currency.id}
          />
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
          isCurrencySupported(currency) && (
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

// FIXME: PROBABLY SOME TYPE OF StyleProp<ViewProp>
class VerticalConnector extends Component<{
  style:
    | Record<string, string | number>
    | Array<Record<string, string | number>>;
}> {
  render() {
    const { style } = this.props;
    return <View style={style} />;
  }
}

export default SendSummary;
