import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import * as Sentry from "@sentry/react-native";
import Button from "../components/Button";
import GenericErrorView from "../components/GenericErrorView";

class DebugBLE extends Component<
  {
    navigation: any;
  },
  {
    renderCrash: boolean;
    renderErrorModal: boolean;
  }
> {
  state: {
    renderCrash: boolean;
    renderErrorModal: boolean;
  } = {
    renderCrash: false,
    renderErrorModal: false,
  };
  jsCrash: () => Error = () => {
    throw new Error("DEBUG jsCrash");
  };
  nativeCrash: () => void = () => {
    Sentry.nativeCrash();
  };
  displayRenderCrash: () => void = () =>
    this.setState({
      renderCrash: true,
    });
  displayErrorModal: () => void = () =>
    this.setState({
      renderErrorModal: true,
    });

  render(): any {
    const { renderCrash, renderErrorModal } = this.state;
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
          title="Render unhandled error"
          onPress={this.displayRenderCrash}
          containerStyle={styles.buttonStyle}
        />
        <Button
          event="DebugCrashRender"
          type="primary"
          title="Render handled error component"
          onPress={this.displayErrorModal}
          containerStyle={styles.buttonStyle}
        />
        {renderCrash && <CrashingComponent />}
        {renderErrorModal && <CrashingComponent handled />}
      </View>
    );
  }
}

const CrashingComponent = ({ handled }: { handled?: boolean }) => {
  const error = new Error("DEBUG render crash error");

  if (handled) {
    return <GenericErrorView error={error} />;
  }

  throw error;
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
    flex: 1,
  },
  buttonStyle: {
    marginBottom: 8,
  },
});
export default DebugBLE;
