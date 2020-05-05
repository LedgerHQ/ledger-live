// @flow

import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import { Sentry } from "react-native-sentry";

import Button from "../components/Button";

class DebugBLE extends Component<
  {
    navigation: *,
  },
  {
    renderCrash: boolean,
  },
> {
  state = {
    renderCrash: false,
  };

  jsCrash = () => {
    throw new Error("DEBUG jsCrash");
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
          event="DebugCrashJS"
          type="primary"
          title="JS Crash"
          onPress={this.jsCrash}
          containerStyle={styles.buttonStyle}
        />
        <Button
          event="DebugCrashNative"
          type="primary"
          title="Native Crash"
          onPress={this.nativeCrash}
          containerStyle={styles.buttonStyle}
        />
        <Button
          event="DebugCrashRender"
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
