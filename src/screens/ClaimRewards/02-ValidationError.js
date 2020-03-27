/* @flow */
import React, { Component } from "react";
import { StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import ValidateError from "../../components/ValidateError";
import { urls } from "../../config/urls";

const forceInset = { bottom: "always" };

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
    navigation.goBack();
  };

  render() {
    const { navigation } = this.props;
    const error = navigation.getParam("error");

    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <TrackScreen category="ClaimRewards" name="ValidationError" />
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

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(ValidationError);
