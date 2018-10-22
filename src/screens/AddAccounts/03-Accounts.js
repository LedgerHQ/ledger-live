// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { SafeAreaView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";

import LText from "../../components/LText";
import Button from "../../components/Button";
import HeaderRightClose from "../../components/HeaderRightClose";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import colors from "../../colors";

type Props = {
  accounts: Account[],
  navigation: NavigationScreenProp<{
    params: {},
  }>,
};

type State = {};

class AddAccountsAccounts extends Component<Props, State> {
  static navigationOptions = ({ navigation }: *) => ({
    headerTitle: <StepHeader title="Accounts" subtitle="step 3 of 4" />,
    headerRight: <HeaderRightClose navigation={navigation} />,
  });

  next = () => {
    this.props.navigation.navigate("AddAccountsSuccess");
  };

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={3} />
        <LText>accounts</LText>
        <Button type="primary" title="next" onPress={this.next} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default translate()(AddAccountsAccounts);
