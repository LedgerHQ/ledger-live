// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import { TrackScreen } from "../../analytics";
import getWindowDimensions from "../../logic/getWindowDimensions";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import { PendingSpinner } from "./PendingContainer";
import LText from "../../components/LText";

const { width } = getWindowDimensions();

class PendingGenuineCheck extends PureComponent<{
  genuineAskedOnDevice: boolean,
}> {
  render() {
    const { genuineAskedOnDevice } = this.props;
    return (
      <View style={styles.root}>
        <TrackScreen category="PairDevices" name="PendingGenuineCheck" />
        {genuineAskedOnDevice ? (
          <View style={styles.nano}>
            <DeviceNanoAction
              modelId="nanoX"
              action="accept"
              screen="validation"
              width={width}
            />
          </View>
        ) : (
          <PendingSpinner />
        )}
        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="PairDevices.GenuineCheck.title" />
        </LText>
        <LText style={styles.subtitle} color="smoke">
          <Trans i18nKey="PairDevices.GenuineCheck.accept">
            {"text"}
            <LText bold>bold text</LText>
          </Trans>
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginTop: 32,
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 21,
  },
  nano: {
    paddingLeft: "33%",
  },
});

export default PendingGenuineCheck;
