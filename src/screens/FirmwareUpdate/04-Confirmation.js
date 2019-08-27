/* @flow */
/* eslint-disable no-console */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import { TrackScreen } from "../../analytics";

import GenericSuccessView from "../../components/GenericSuccessView";
import Button from "../../components/Button";
import colors from "../../colors";

const forceInset = { bottom: "always" };

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
  },
}>;

type Props = {
  navigation: Navigation,
};

type State = {};

class FirmwareUpdateConfirmation extends Component<Props, State> {
  static navigationOptions = {
    header: null,
  };

  onClose = () => {
    this.props.navigation.navigate("Manager");
  };

  render() {
    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <TrackScreen category="FirmwareUpdate" name="Confirmation" />
        <View style={styles.body}>
          <GenericSuccessView
            title={<Trans i18nKey="FirmwareUpdateConfirmation.title" />}
            description={
              <Trans i18nKey="FirmwareUpdateConfirmation.description" />
            }
          />
          <Button
            event="FirmwareUpdateDone"
            type="primary"
            onPress={this.onClose}
            title={<Trans i18nKey="common.close" />}
            containerStyle={styles.button}
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
  body: {
    padding: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 46,
  },
  title: {
    fontSize: 18,
    color: colors.darkBlue,
    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 32,
    color: colors.smoke,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 16,
  },
});

export default translate()(FirmwareUpdateConfirmation);
