// @flow
import React, { Component } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { BigNumber as BigNumberType } from "bignumber.js";

import colors from "../../colors";

import { accountScreenSelector } from "../../reducers/accounts";

import BlueButton from "../../components/BlueButton";
import HeaderRightClose from "../../components/HeaderRightClose";

import FeesRow from "./FeesRow";
import CustomFeesRow from "./CustomFeesRow";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    address: string,
    amount: string,
    amountBigNumber: BigNumberType,
    fees: number,
  }>,
};
type State = {
  fees: number,
};

class FeeSettings extends Component<Props, State> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Edit fees",
    headerRight: <HeaderRightClose navigation={navigation} />,
  });

  state = {
    // $FlowFixMe
    fees: this.props.navigation.state.params.fees,
  };

  onPressFees = (fees: number) => this.setState({ fees });

  onValidateFees = () => {
    const { navigation, account } = this.props;
    const {
      state: {
        // $FlowFixMe
        params,
      },
    } = navigation;
    const { fees } = this.state;
    Keyboard.dismiss();
    navigation.navigate("SendSummary", {
      ...params,
      accountId: account.id,
      fees,
    });
  };

  render(): React$Node {
    const keyboardVerticalOffset = Platform.OS === "ios" ? 60 : 0;

    return (
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.container}
          keyboardVerticalOffset={keyboardVerticalOffset}
          behavior="padding"
          enabled
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <FeesRow
                title="Low"
                value={5}
                currentValue={this.state.fees}
                onPress={this.onPressFees}
              />
              <FeesRow
                title="Standard"
                value={10}
                currentValue={this.state.fees}
                onPress={this.onPressFees}
              />
              <FeesRow
                title="High"
                value={15}
                currentValue={this.state.fees}
                onPress={this.onPressFees}
              />
              <CustomFeesRow
                title="Custom"
                currentValue={this.state.fees}
                onPress={this.onPressFees}
              />
              <View style={styles.buttonContainer}>
                <BlueButton
                  title="Validate Fees"
                  containerStyle={styles.continueButton}
                  titleStyle={styles.continueButtonTitle}
                  onPress={this.onValidateFees}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  buttonContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  continueButton: {
    height: "auto",
    paddingVertical: 16,
    alignSelf: "stretch",
  },
  continueButtonTitle: {
    fontSize: 16,
    fontFamily: "Museo Sans",
  },
  container: {
    flex: 1,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(FeeSettings);
