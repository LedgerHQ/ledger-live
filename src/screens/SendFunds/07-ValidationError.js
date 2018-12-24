/* @flow */
import React, { Component } from "react";
import { StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import ValidateError from "./ValidateError";
import { urls } from "../../config/urls";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      deviceId: string,
      transaction: *,
      error: Error,
    },
  }>,
};

class ValidationError extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  dismiss = () => {
    const { navigation } = this.props;
    if (navigation.dismiss) {
      const dismissed = navigation.dismiss();
      if (!dismissed) navigation.goBack();
    }
  };

  contactUs = () => {
    Linking.openURL(urls.contact);
  };

  retry = () => {
    const { navigation } = this.props;
    // $FlowFixMe
    navigation.replace("SendSummary", {
      ...navigation.state.params,
    });
  };

  render() {
    const { navigation } = this.props;
    const error = navigation.getParam("error");

    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="SendFunds" name="ValidationError" />
        <ValidateError
          error={error}
          onRetry={this.retry}
          onClose={this.dismiss}
          onContactUs={this.contactUs}
        />
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

const mapStateToProps = (state, props) => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(translate()(ValidationError));
