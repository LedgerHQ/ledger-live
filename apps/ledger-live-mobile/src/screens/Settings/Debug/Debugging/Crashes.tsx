import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import Button from "~/components/Button";
import GenericErrorView from "~/components/GenericErrorView";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { isDatadogEnabled } from "~/datadog";

const styles = StyleSheet.create({
  root: {
    padding: 16,
    flex: 1,
  },
  buttonStyle: {
    marginBottom: 8,
  },
});

const CrashingComponent = ({ handled }: { handled?: boolean }) => {
  const error = new Error("DEBUG render crash error");

  if (handled) {
    return <GenericErrorView error={error} />;
  }

  throw error;
};

type Props = StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugCrash>;

const Crashes = (_: Props) => {
  const [renderCrash, setRenderCrash] = useState(false);
  const [renderErrorModal, setRenderErrorModal] = useState(false);

  /** Unhandled: throw → Datadog global handler sends to RUM, then app crashes / red screen */
  const jsCrash = () => {
    throw new Error("DEBUG jsCrash");
  };

  /** Manual: send error to RUM via DdRum.addError, no crash */
  const sendErrorToRum = () => {
    const error = new Error("DEBUG RUM error (manual)");
    if (isDatadogEnabled) {
      DdRum.addError(
        error.message,
        ErrorSource.SOURCE,
        error.stack ?? "",
        { debug: true },
      ).then(() => {
        Alert.alert("Datadog", "JS error sent to RUM (non-fatal).");
      });
    } else {
      Alert.alert("Datadog disabled", "Enable Datadog to send test errors to RUM.");
    }
  };

  return (
    <View style={styles.root}>
      <Button
        event="DebugCrashJS"
        type="primary"
        title="JS Crash"
        onPress={jsCrash}
        containerStyle={styles.buttonStyle}
      />

      <Button
        event="DebugCrashRumManual"
        type="primary"
        title="Send error to RUM (manual)"
        onPress={sendErrorToRum}
        containerStyle={styles.buttonStyle}
      />

      <Button
        event="DebugCrashRender"
        type="primary"
        title="Render unhandled error"
        onPress={() => setRenderCrash(true)}
        containerStyle={styles.buttonStyle}
      />

      <Button
        event="DebugCrashRender"
        type="primary"
        title="Render handled error component"
        onPress={() => setRenderErrorModal(true)}
        containerStyle={styles.buttonStyle}
      />

      {renderCrash && <CrashingComponent />}
      {renderErrorModal && <CrashingComponent handled />}
    </View>
  );
};

export default Crashes;
