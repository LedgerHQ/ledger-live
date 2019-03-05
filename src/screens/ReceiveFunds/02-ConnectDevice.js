// @flow
import React, { Component } from "react";
import i18next from "i18next";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import StepHeader from "../../components/StepHeader";
import SelectDevice from "../../components/SelectDevice";
import Button from "../../components/Button";
import {
  connectingStep,
  accountApp,
  receiveVerifyStep,
} from "../../components/DeviceJob/steps";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import ReadOnlyWarning from "./ReadOnlyWarning";
import NotSyncedWarning from "./NotSyncedWarning";

type Navigation = NavigationScreenProp<{
  params: {
    accountId: string,
  },
}>;

type Props = {
  account: Account,
  navigation: Navigation,
  readOnlyModeEnabled: boolean,
};

const mapStateToProps = createStructuredSelector({
  readOnlyModeEnabled: readOnlyModeEnabledSelector,
  account: accountScreenSelector,
});

class ConnectDevice extends Component<Props> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    const key = (params && params.title) || "transfer.receive.titleDevice";

    return {
      headerTitle: (
        <StepHeader
          title={i18next.t(key)}
          subtitle={i18next.t("send.stepperHeader.stepRange", {
            currentStep: "2",
            totalSteps: "3",
          })}
        />
      ),
    };
  };

  componentDidMount() {
    const { readOnlyModeEnabled } = this.props;

    if (readOnlyModeEnabled) {
      this.props.navigation.setParams({
        title: "transfer.receive.titleReadOnly",
        headerRight: null,
      });
    }
  }

  onSelectDevice = (meta: *) => {
    const { navigation, account } = this.props;
    navigation.navigate("ReceiveConfirmation", {
      accountId: account.id,
      ...meta,
    });
  };

  onSkipDevice = () => {
    const { navigation, account } = this.props;
    navigation.navigate("ReceiveConfirmation", {
      accountId: account.id,
    });
  };

  renderReadOnly = () => <ReadOnlyWarning continue={this.onSkipDevice} />;
  renderNotSyncedOnly = () => (
    <NotSyncedWarning
      continue={this.onSkipDevice}
      accountId={this.props.account.id}
    />
  );

  render() {
    const { readOnlyModeEnabled, account } = this.props;

    if (readOnlyModeEnabled) {
      return this.renderReadOnly();
    }

    if (!account.freshAddress) {
      return this.renderNotSyncedOnly();
    }

    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="ReceiveFunds" name="ConnectDevice" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
        >
          <SelectDevice
            onSelect={this.onSelectDevice}
            steps={[
              connectingStep,
              accountApp(account),
              receiveVerifyStep(account),
            ]}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            event="ReceiveWithoutDevice"
            type="lightSecondary"
            title={<Trans i18nKey="transfer.receive.withoutDevice" />}
            onPress={this.onSkipDevice}
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
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  footer: {
    padding: 4,
    borderTopWidth: 1,
    borderTopColor: colors.lightFog,
  },
});

export default compose(
  connect(mapStateToProps),
  translate(),
)(ConnectDevice);
