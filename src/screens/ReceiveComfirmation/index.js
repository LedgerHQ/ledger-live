// @flow
import React, { Component } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";

import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import HeaderRightClose from "../../components/HeaderRightClose";
import Button from "../../components/Button";
import LText from "../../components/LText/index";
import DisplayAddress from "../../components/DisplayAddress";
import VerifyAddressDisclaimer from "../../components/VerifyAddressDisclaimer";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
    },
  }>,
};
type State = {
  verified: boolean,
};

class ReceiveConfirmation extends Component<Props, State> {
  static navigationOptions = ({ screenProps }: *) => ({
    headerTitle: <StepHeader title="Receive" subtitle="step 4 of 4" />,
    headerRight: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    ),
  });

  state = {
    verified: false,
  };

  timeout: *;

  componentDidMount() {
    this.timeout = setTimeout(this.verify, 2000);
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  verify = () => this.setState({ verified: true });

  render(): React$Node {
    const { account } = this.props;
    const { verified } = this.state;
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={4} />
        <View style={styles.container}>
          <View style={styles.qrWrapper}>
            <QRCode size={130} value={account.freshAddress} />
          </View>
          <View style={styles.addressContainer}>
            <LText style={styles.addressTitle}>
              Address account for{" "}
              <LText
                semiBold
                style={[styles.addressTitle, styles.addressTitleBold]}
              >
                {account.name}
              </LText>
            </LText>
            <View style={styles.address}>
              <DisplayAddress address={account.freshAddress} />
            </View>
            <VerifyAddressDisclaimer
              verified={verified}
              accountType={account.currency.managerAppName}
            />
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <Button
            type="primary"
            title="Verify Address"
            onPress={() => console.warn("TODO: trigger verify on device")}
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
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: "center",
  },
  bottomContainer: {
    padding: 16,
  },
  qrWrapper: {
    borderWidth: 1,
    borderColor: colors.lightFog,
    padding: 15,
  },
  addressContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  addressTitle: {
    fontSize: 12,
    color: colors.smoke,
  },
  addressTitleBold: {
    color: colors.darkBlue,
  },
  address: {
    paddingTop: 16,
    paddingBottom: 24,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(ReceiveConfirmation);
