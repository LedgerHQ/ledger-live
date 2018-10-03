// @flow

import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { Sentry } from "react-native-sentry";

import loadLibcore from "../libcore/load";

import Button from "../components/Button";

class DebugBLE extends Component<
  {
    navigation: NavigationScreenProp<*>,
  },
  {
    renderCrash: boolean,
  },
> {
  static navigationOptions = {
    title: "Debug Crash",
  };

  state = {
    renderCrash: false,
  };

  jsCrash = () => {
    throw new Error("DEBUG jsCrash");
  };

  libcoreCrash = async () => {
    const core = await loadLibcore();
    await core.coreWalletPool.getWallet(null, null);
  };

  nativeCrash = () => {
    Sentry.nativeCrash();
  };

  displayRenderCrash = () => this.setState({ renderCrash: true });

  render() {
    const { renderCrash } = this.state;
    return (
      <View style={styles.root}>
        <Button
          type="primary"
          title="JS Crash"
          onPress={this.jsCrash}
          containerStyle={styles.buttonStyle}
        />
        <Button
          type="primary"
          title="Native Crash"
          onPress={this.nativeCrash}
          containerStyle={styles.buttonStyle}
        />
        <Button
          type="primary"
          title="Libcore Crash"
          onPress={this.libcoreCrash}
          containerStyle={styles.buttonStyle}
        />
        <Button
          type="primary"
          title="Render crashing component"
          onPress={this.displayRenderCrash}
          containerStyle={styles.buttonStyle}
        />
        {renderCrash && <CrashingComponent />}
      </View>
    );
  }
}

const CrashingComponent = () => {
  throw new Error("DEBUG renderCrash");
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  buttonStyle: {
    marginBottom: 16,
  },
});

export default DebugBLE;
