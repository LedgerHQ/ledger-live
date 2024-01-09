import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import TrackScreen from "~/analytics/TrackScreen";
import LText from "~/components/LText";
import Button from "~/components/Button";
import AlertTriangle from "~/icons/AlertTriangle";

type Props = {
  continue: () => void;
};

function ReadOnlyWarning({ continue: onContinue }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
        },
      ]}
    >
      <TrackScreen category="Deposit" name="ReadOnlyNanoX" />
      <View style={styles.alert}>
        <AlertTriangle size={32} color={colors.live} />
      </View>
      <LText secondary semiBold style={styles.title}>
        <Trans i18nKey="transfer.receive.readOnly.text" />
      </LText>
      <LText style={styles.desc} color="grey">
        <Trans i18nKey="transfer.receive.readOnly.desc" />
      </LText>
      <Button
        event="ReadOnlyOnboarding"
        type="primary"
        containerStyle={styles.button}
        title={<Trans i18nKey="common.continue" />}
        onPress={onContinue}
      />
    </View>
  );
}

export default memo<Props>(ReadOnlyWarning);
const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: 32,
  },
});
