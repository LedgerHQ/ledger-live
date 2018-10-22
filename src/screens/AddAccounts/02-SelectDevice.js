// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { SafeAreaView, StyleSheet, View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Currency } from "@ledgerhq/live-common/lib/types";

import LText from "../../components/LText";
import Button from "../../components/Button";
import HeaderRightClose from "../../components/HeaderRightClose";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      currency: Currency,
    },
  }>,
};

type State = {};

class AddAccountsSelectDevice extends Component<Props, State> {
  static navigationOptions = ({ navigation }: *) => ({
    headerTitle: <StepHeader title="Device" subtitle="step 2 of 4" />,
    headerRight: <HeaderRightClose navigation={navigation} />,
  });

  next = () => {
    this.props.navigation.navigate("AddAccountsAccounts");
  };

  render() {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={2} />
        <View style={{ padding: 20 }}>
          <LText style={{ fontSize: 20 }}>{`you chose currency: ${
            currency.name
          }`}</LText>
        </View>
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

export default translate()(AddAccountsSelectDevice);
