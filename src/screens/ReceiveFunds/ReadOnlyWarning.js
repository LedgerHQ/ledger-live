/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../colors";
import TrackScreen from "../../analytics/TrackScreen";
import LText from "../../components/LText";
import Button from "../../components/Button";
import AlertTriangle from "../../icons/AlertTriangle";

class ReadOnlyWarning extends PureComponent<{ continue: () => void }> {
  render() {
    return (
      <View style={styles.root}>
        <TrackScreen category="Manager" name="ReadOnlyNanoX" />
        <View style={styles.alert}>
          <AlertTriangle size={32} color={colors.live} />
        </View>
        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="transfer.receive.readOnly.text" />
        </LText>
        <LText style={styles.desc}>
          <Trans i18nKey="transfer.receive.readOnly.desc" />
        </LText>
        <Button
          event="ReadOnlyOnboarding"
          type="primary"
          containerStyle={styles.button}
          title={<Trans i18nKey="common.continue" />}
          onPress={this.props.continue}
        />
      </View>
    );
  }
}

export default ReadOnlyWarning;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.lightGrey,
  },
  alert: {
    marginBottom: 32,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF3FD",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    alignItems: "center",
  },
  button: {
    width: "100%",
  },
  title: {
    marginBottom: 16,
    fontSize: 16,
  },
  desc: {
    color: colors.grey,
    textAlign: "center",
    marginBottom: 32,
  },
});
