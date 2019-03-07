/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import { connect } from "react-redux";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { BigNumber } from "bignumber.js";

import { getAccountBridge } from "../../bridge";
import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import LText from "../../components/LText";
import TranslatedError from "../../components/TranslatedError";
import SummaryFromSection from "./SummaryFromSection";
import SummaryToSection from "./SummaryToSection";
import SummaryAmountSection from "./SummaryAmountSection";
import SendRowsCustom from "../../families/SendRowsCustom";
import SendRowsFee from "../../families/SendRowsFee";
import SummaryTotalSection from "./SummaryTotalSection";
import StepHeader from "../../components/StepHeader";
import SectionSeparator from "../../components/SectionSeparator";

// TODO put this somewhere
const similarError = (a, b) =>
  a === b || (a && b && a.name === b.name && a.message === b.message);

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: *,
    },
  }>,
};

class SendSummary extends Component<
  Props,
  {
    totalSpent: ?BigNumber,
    error: ?Error,
  },
> {
  static navigationOptions = {
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

  state = {
    totalSpent: null,
    error: null, // TODO use error somewhere!
  };

  componentDidMount() {
    this.syncTotalSpent();
  }

  componentDidUpdate() {
    this.syncTotalSpent();
  }

  componentWillUnmount() {
    this.nonceTotalSpent++;
  }

  openFees = () => {
    const { account, navigation } = this.props;
    this.props.navigation.navigate("EditFees", {
      accountId: account.id,
      transaction: navigation.getParam("transaction"),
    });
  };

  onContinue = async () => {
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    await bridge.checkValidTransaction(account, transaction);
    navigation.navigate("SendConnectDevice", {
      accountId: account.id,
      transaction,
    });
  };

  setError = (error: Error) => {
    this.setState(old => {
      if (similarError(old.error, error)) return null;
      return { error };
    });
  };

  // React Hooks PLZ. same code as step 3.
  nonceTotalSpent = 0;
  syncTotalSpent = async () => {
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const nonce = ++this.nonceTotalSpent;
    try {
      const totalSpent = await bridge.getTotalSpent(account, transaction);
      if (nonce !== this.nonceTotalSpent) return;

      await bridge.checkValidTransaction(account, transaction);
      if (nonce !== this.nonceTotalSpent) return;

      this.setState(old => {
        if (
          !old.error &&
          old.totalSpent &&
          totalSpent &&
          totalSpent.eq(old.totalSpent)
        ) {
          return null;
        }
        return { totalSpent, error: null };
      });
    } catch (e) {
      if (nonce !== this.nonceTotalSpent) return;

      this.setError(e);
    }
  };

  render() {
    const { totalSpent, error } = this.state;
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const amount = bridge.getTransactionAmount(account, transaction);
    const recipient = bridge.getTransactionRecipient(account, transaction);

    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="SendFunds" name="Summary" />
        <ScrollView style={styles.body}>
          <SummaryFromSection account={account} />
          <VerticalConnector />
          <SummaryToSection recipient={recipient} />
          <SendRowsCustom
            transaction={transaction}
            account={account}
            navigation={navigation}
          />
          <SectionSeparator lineColor={colors.lightFog} />
          <SummaryAmountSection account={account} amount={amount} />
          <SendRowsFee
            account={account}
            transaction={transaction}
            navigation={navigation}
          />
          <SectionSeparator lineColor={colors.lightFog} />
          <SummaryTotalSection
            account={account}
            amount={totalSpent || amount}
          />
        </ScrollView>
        <View style={styles.footer}>
          <LText style={styles.error}>
            <TranslatedError error={error} />
          </LText>
          <Button
            event="SummaryContinue"
            type="primary"
            title={<Trans i18nKey="common.continue" />}
            containerStyle={styles.continueButton}
            onPress={this.onContinue}
            disabled={!totalSpent || !!error}
          />
        </View>
      </SafeAreaView>
    );
  }
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
  verticalConnector: {
    position: "absolute",
    borderLeftWidth: 2,
    borderColor: colors.lightFog,
    height: 20,
    top: 60,
    left: 16,
  },
});

const mapStateToProps = (state, props) => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(translate()(SendSummary));

class VerticalConnector extends Component<*> {
  render() {
    return <View style={styles.verticalConnector} />;
  }
}
