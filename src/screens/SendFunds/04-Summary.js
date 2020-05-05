/* @flow */
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useState, useCallback, Component } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import { useTransactionChangeFromNavigation } from "../../logic/screenTransactionHooks";
import Button from "../../components/Button";
import LText from "../../components/LText";
import TranslatedError from "../../components/TranslatedError";
import SendRowsCustom from "../../components/SendRowsCustom";
import SendRowsFee from "../../components/SendRowsFee";
import SummaryFromSection from "./SummaryFromSection";
import SummaryToSection from "./SummaryToSection";
import SummaryAmountSection from "./SummaryAmountSection";
import SummaryTotalSection from "./SummaryTotalSection";
import SectionSeparator from "../../components/SectionSeparator";
import AlertTriangle from "../../icons/AlertTriangle";
import ConfirmationModal from "../../components/ConfirmationModal";
import NavigationScrollView from "../../components/NavigationScrollView";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

export default function SendSummary({ navigation, route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
  } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));

  // handle any edit screen changes like fees changes
  useTransactionChangeFromNavigation(setTransaction);

  const [highFeesOpen, setHighFeesOpen] = useState(false);

  const onAcceptFees = useCallback(async () => {
    navigation.navigate(ScreenName.SendConnectDevice, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      status,
    });

    setHighFeesOpen(false);
  }, [
    setHighFeesOpen,
    status,
    account,
    parentAccount,
    navigation,
    transaction,
  ]);

  const onRejectFees = useCallback(() => {
    setHighFeesOpen(false);
  }, [setHighFeesOpen]);

  const onContinue = useCallback(async () => {
    const { warnings } = status;
    if (Object.keys(warnings).includes("feeTooHigh")) {
      setHighFeesOpen(true);
      return;
    }

    navigation.navigate(ScreenName.SendConnectDevice, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      status,
    });
  }, [
    setHighFeesOpen,
    status,
    account,
    parentAccount,
    navigation,
    transaction,
  ]);

  if (!account || !transaction || !transaction.recipient) return null; // FIXME why is recipient sometimes empty?

  const {
    amount,
    totalSpent,
    errors: { transaction: transactionError },
  } = status;
  const mainAccount = getMainAccount(account, parentAccount);

  // console.log({ transaction, status, bridgePending });

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="SendFunds" name="Summary" />
      <NavigationScrollView style={styles.body}>
        <SummaryFromSection account={account} parentAccount={parentAccount} />
        <VerticalConnector />
        <SummaryToSection recipient={transaction.recipient} />
        {status.warnings.recipient ? (
          <LText style={styles.warning}>
            <TranslatedError error={status.warnings.recipient} />
          </LText>
        ) : null}
        <SendRowsCustom
          transaction={transaction}
          account={mainAccount}
          navigation={navigation}
        />
        <SectionSeparator lineColor={colors.lightFog} />
        <SummaryAmountSection
          account={account}
          parentAccount={parentAccount}
          amount={amount}
        />
        <SendRowsFee
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          navigation={navigation}
        />
        <SectionSeparator lineColor={colors.lightFog} />
        <SummaryTotalSection
          account={account}
          parentAccount={parentAccount}
          amount={totalSpent}
        />
      </NavigationScrollView>
      <View style={styles.footer}>
        <LText style={styles.error}>
          <TranslatedError error={transactionError} />
        </LText>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!transactionError}
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
            <LText bold>10%</LText>
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
    backgroundColor: colors.white,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
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
    color: colors.alert,
    fontSize: 12,
    marginBottom: 5,
  },
  warning: {
    color: colors.orange,
    fontSize: 14,
    marginBottom: 16,
    paddingLeft: 50,
  },
  verticalConnector: {
    position: "absolute",
    borderLeftWidth: 2,
    borderColor: colors.lightFog,
    height: 20,
    top: 60,
    left: 16,
  },
});

class VerticalConnector extends Component<*> {
  render() {
    return <View style={styles.verticalConnector} />;
  }
}
