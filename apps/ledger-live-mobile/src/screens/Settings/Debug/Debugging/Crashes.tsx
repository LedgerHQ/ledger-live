import * as Sentry from "@sentry/react-native";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Button from "~/components/Button";
import GenericErrorView from "~/components/GenericErrorView";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";

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

  const jsCrash = () => {
    throw new Error("DEBUG jsCrash");
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
        event="DebugCrashNative"
        type="primary"
        title="Native Crash"
        onPress={Sentry.nativeCrash}
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
