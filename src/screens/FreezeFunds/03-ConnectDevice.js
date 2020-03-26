// @flow
import React, { Component } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import i18next from "i18next";

import type { NavigationScreenProp } from "react-navigation";
import type {
  Account,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";

import { accountAndParentScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import StepHeader from "../../components/StepHeader";
import SelectDevice from "../../components/SelectDevice";
import { connectingStep, accountApp } from "../../components/DeviceJob/steps";

const forceInset = { bottom: "always" };

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
      status: TransactionStatus,
    },
  }>,
};

class ConnectDevice extends Component<Props> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("freeze.stepperHeader.connectDevice")}
        subtitle={i18next.t("freeze.stepperHeader.stepRange", {
          currentStep: "2",
          totalSteps: "3",
        })}
      />
    ),
  };

  onSelectDevice = (meta: *) => {
    const { navigation } = this.props;
    // $FlowFixMe
    navigation.replace("FreezeValidation", {
      ...navigation.state.params,
      ...meta,
    });
  };

  render() {
    const { account } = this.props;
    if (!account) return null;

    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
        >
          <TrackScreen category="FreezeFunds" name="ConnectDevice" />
          <SelectDevice
            onSelect={this.onSelectDevice}
            steps={[connectingStep, accountApp(account)]}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(ConnectDevice);
