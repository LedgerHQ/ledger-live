/* @flow */
/* eslint-disable no-console */
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";

import Circle from "../../components/Circle";
import LText from "../../components/LText";
import Button from "../../components/Button";
import colors, { lighten } from "../../colors";

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
      <SafeAreaView style={styles.root}>
        <View style={styles.body}>
          <View style={styles.icon}>
            <Circle size={80} bg={lighten(colors.green, 0.75)}>
              <Icon size={40} color={colors.green} name="check-circle" />
            </Circle>
          </View>
          <LText secondary semiBold style={styles.title}>
            <Trans i18nKey="FirmwareUpdateConfirmation.title" />
          </LText>
          <LText style={styles.message}>
            <Trans i18nKey="FirmwareUpdateConfirmation.description" />
          </LText>
          <Button
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
