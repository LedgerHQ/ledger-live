// @flow
// TODO rename this file at the end (don't want to mess up merges after renaming)

import React, { Component } from "react";
import { SafeAreaView, View, StyleSheet, Dimensions } from "react-native";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";

import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { open } from "../../logic/hw";

import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import LText from "../../components/LText/index";
import DisplayAddress from "../../components/DisplayAddress";
import VerifyAddressDisclaimer from "../../components/VerifyAddressDisclaimer";

type Navigation = NavigationScreenProp<{
  params: {
    accountId: string,
    deviceId: string,
  },
}>;

type Props = {
  account: Account,
  navigation: Navigation,
};

type State = {
  verified: boolean,
};

class ReceiveConfirmation extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Receive" subtitle="3 of 3" />,
  };

  state = {
    verified: false,
  };

  componentDidMount() {
    const deviceId = this.props.navigation.getParam("deviceId");
    if (deviceId) this.verifyOnDevice(deviceId);
  }

  verifyOnDevice = async (deviceId: string) => {
    const { account } = this.props;

    const transport = await open(deviceId);
    getAddress(transport, account.currency, account.freshAddressPath, true);
    await transport.close();
    this.setState({ verified: true });
  };

  onVerifyAddress = () => {
    // FIXME re check what the LL is doing on this? (going back to a step or is it a device call?)
  };

  render(): React$Node {
    const { account, navigation } = this.props;
    const { verified } = this.state;
    const { width } = Dimensions.get("window");
    const unsafe = !navigation.getParam("deviceId"); // eslint-disable-line no-unused-vars
    // TODO: use unsafe to render the error case

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={3} currentStep={3} />
        <View style={styles.container}>
          <View style={styles.qrWrapper}>
            <QRCode size={width / 2 - 30} value={account.freshAddress} />
          </View>
          <View>
            <LText style={styles.addressTitle}>Address for account</LText>
          </View>
          <View>
            <LText semiBold style={styles.addressTitleBold}>
              {account.name}
            </LText>
          </View>
          <View style={styles.address}>
            <DisplayAddress address={account.freshAddress} />
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <VerifyAddressDisclaimer
            verified={verified}
            accountType={account.currency.managerAppName}
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
    borderRadius: 4,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      height: 4,
    },
  },
  addressTitle: {
    paddingTop: 24,
    fontSize: 14,
    color: colors.grey,
  },
  addressTitleBold: {
    paddingTop: 4,
    fontSize: 16,
    color: colors.darkBlue,
  },
  address: {
    paddingTop: 25,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(ReceiveConfirmation);
