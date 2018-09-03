// @flow
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet, Image } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";

import HeaderRightClose from "../../components/HeaderRightClose";
import StepHeader from "../../components/StepHeader";
import LText from "../../components/LText/index";

import colors from "../../colors";
import Stepper from "../../components/Stepper";
import BlueButton from "../../components/BlueButton";

import deviceConnected from "../../images/device-connected.png";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
    },
  }>,
};
type State = {};

class VerifyAddress extends Component<Props, State> {
  static navigationOptions = ({ screenProps }: *) => ({
    headerTitle: <StepHeader title="Verification" subtitle="step 3 of 4" />,
    headerRight: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    ),
  });

  navigate = () => {
    const { navigation, account } = this.props;
    navigation.navigate("ReceiveConfirmation", {
      accountId: account.id,
    });
  };

  render(): React$Node {
    const { account } = this.props;
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={3} />
        <View style={styles.container}>
          <LText semiBold style={styles.title}>
            Verify address on device
          </LText>
          <LText style={styles.subtitle}>
            {`A ${account.currency.managerAppName} receive address will be
            displayed on your device. Carefully verify that it matches the
            address on your computer.`}
          </LText>
        </View>
        <Image source={deviceConnected} />
        <View style={styles.bottomContainer}>
          <BlueButton
            title="Verify"
            onPress={this.navigate}
            containerStyle={styles.continueButton}
            titleStyle={styles.continueButtonText}
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  bottomContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    color: colors.darkBlue,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: colors.smoke,
  },
  continueButton: {
    paddingVertical: 16,
    height: "auto",
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: "Museo Sans",
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(VerifyAddress);
