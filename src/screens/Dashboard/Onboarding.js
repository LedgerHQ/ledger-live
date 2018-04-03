/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import LText from "../../components/LText";
import BlueButton from "../../components/BlueButton";
import GenerateMockAccountsButton from "../../components/GenerateMockAccountsButton";

export default class Onboarding extends PureComponent<{
  goToImportAccounts: () => void
}> {
  render() {
    const { goToImportAccounts } = this.props;
    return (
      <View style={styles.root}>
        <LText semiBold style={styles.title}>
          No accounts yet!
        </LText>
        <View style={styles.buttons}>
          <BlueButton
            title="Import Accounts"
            onPress={goToImportAccounts}
            containerStyle={styles.importButton}
          />
          {__DEV__ ? (
            <GenerateMockAccountsButton title="Generate Mock" />
          ) : null}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 40,
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center"
  },
  buttons: {
    flexDirection: "row"
  },
  importButton: {
    marginRight: 20
  }
});
