/* @flow */
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useState, useCallback, Component } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import { connect } from "react-redux";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";
import type { NavigationScreenProp } from "react-navigation";
import type {
  Account,
  AccountLike,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
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
import StepHeader from "../../components/StepHeader";
import SectionSeparator from "../../components/SectionSeparator";
import AlertTriangle from "../../icons/AlertTriangle";
import ConfirmationModal from "../../components/ConfirmationModal";

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
};

const SendSummary = ({ account, parentAccount, navigation }: Props) => {
  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
  } = useBridgeTransaction(() => ({
    transaction: navigation.getParam("transaction"),
    account,
    parentAccount,
  }));

  // handle any edit screen changes like fees changes
  useTransactionChangeFromNavigation({
    navigation,
    setTransaction,
  });

  const [highFeesOpen, setHighFeesOpen] = useState(false);

  const onAcceptFees = useCallback(async () => {
    navigation.navigate("SendConnectDevice", {
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

    navigation.navigate("SendConnectDevice", {
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
      <ScrollView style={styles.body}>
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
      </ScrollView>
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
};

SendSummary.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("send.stepperHeader.summary")}
      subtitle={i18next.t("send.stepperHeader.stepRange", {
        currentStep: "4",
        totalSteps: "6",
      })}
    />
  ),
};

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

export default connect(accountAndParentScreenSelector)(
  translate()(SendSummary),
);

class VerticalConnector extends Component<*> {
  render() {
    return <View style={styles.verticalConnector} />;
  }
}
