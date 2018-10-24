/* @flow */
import React, { Component } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { BigNumber } from "bignumber.js";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import type { T } from "../../types/common";
import { accountScreenSelector } from "../../reducers/accounts";

import colors from "../../colors";

import LText from "../../components/LText/index";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Button from "../../components/Button";

import AmountInput from "./AmountInput";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";

type Props = {
  t: T,
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    address: string,
  }>,
};

type State = {
  amount: BigNumber,
};

class SelectFunds extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Amount" subtitle="step 3 of 6" />,
  };

  state = {
    amount: BigNumber(0),
  };

  blur = () => {
    Keyboard.dismiss();
  };

  onChange = (amount: BigNumber) => {
    if (!amount.isNaN()) {
      this.setState({ amount });
    }
  };

  navigate = () => {
    const { account, navigation } = this.props;
    const address = navigation.getParam("address");
    const { amount } = this.state;
    navigation.navigate("SendSummary", {
      accountId: account.id,
      address,
      amount,
    });
  };

  render() {
    const { account, t } = this.props;
    const { amount } = this.state;

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={5} currentStep={3} />
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={this.blur}>
            <View style={{ flex: 1 }}>
              {/* $FlowFixMe */}
              <AmountInput
                account={account}
                onChange={this.onChange}
                currency={account.unit.code}
                value={amount}
              />

              <View style={styles.bottomWrapper}>
                <LText style={styles.available}>
                  <Trans i18nKey="send.amount.available">
                    You have
                    <LText tertiary style={styles.availableAmount}>
                      <CurrencyUnitValue
                        showCode
                        unit={account.unit}
                        value={account.balance}
                      />
                    </LText>
                    available
                  </Trans>
                </LText>
                <View style={styles.continueWrapper}>
                  <Button
                    type="primary"
                    title={t("common:common.continue")}
                    onPress={this.navigate}
                    // disabled={!isValid}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  available: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 16,
  },
  availableAmount: {
    color: colors.darkBlue,
  },
  countervaluesWrapper: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  countervaluesText: {
    color: colors.grey,
    fontSize: 20,
  },
  bottomWrapper: {
    flex: 1,
    flexGrow: 1,
    flexDirection: "column",
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
});

const mapStateToProps = (state, props: Props): { account: Account } => ({
  account: accountScreenSelector(state, props),
});

export default compose(
  translate(),
  connect(mapStateToProps),
)(SelectFunds);
