/* @flow */
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";

import Button from "../../components/Button";

import colors from "../../colors";

import SummaryFromSection from "./SummaryFromSection";
import SummaryToSection from "./SummaryToSection";
import SectionSeparator from "./SectionSeparator";
import SummaryCustomFields from "./SummaryCustomFields";
import SummaryAmountSection from "./SummaryAmountSection";
import SummaryFeesSection from "./SummaryFeesSection";
import SummaryTotalSection from "./SummaryTotalSection";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import { getAccountBridge } from "../../bridge";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: *,
    },
  }>,
};

class SendSummary extends Component<Props> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Summary" subtitle="step 4 of 6" />,
  };

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

  render() {
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const amount = bridge.getTransactionAmount(account, transaction);
    const recipient = bridge.getTransactionRecipient(account, transaction);

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={6} currentStep={4} />
        <SummaryFromSection account={account} />
        <SummaryToSection recipient={recipient} />
        <SectionSeparator />
        <SummaryCustomFields
          transaction={transaction}
          account={account}
          navigation={navigation}
        />
        <SummaryAmountSection account={account} amount={amount} />
        <SummaryFeesSection
          account={account}
          transaction={transaction}
          navigation={navigation}
        />
        <SectionSeparator />
        <SummaryTotalSection account={account} amount={amount} />
        <View style={styles.summary}>
          <Button
            type="primary"
            title="Continue"
            containerStyle={styles.continueButton}
            onPress={this.onContinue}
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
  },
  summary: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
});

const mapStateToProps = (state, props) => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(SendSummary);
