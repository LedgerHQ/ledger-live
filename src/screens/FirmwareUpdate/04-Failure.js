/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import GenericErrorView from "../../components/GenericErrorView";
import Button from "../../components/Button";
import NeedHelp from "../../components/NeedHelp";
import { ScreenName } from "../../const";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  deviceId: string,
  error: Error,
};

export default function FirmwareUpdateFailure({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onRetry = useCallback(() => {
    if (navigation.replace) {
      navigation.replace(ScreenName.FirmwareUpdateMCU, route.params);
    }
  }, [navigation, route.params]);

  const onClose = useCallback(() => {
    const n = navigation.dangerouslyGetParent();
    if (n) n.goBack();
  }, [navigation]);

  const error = route.params.error;
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="FirmwareUpdate" name="Failure" />
      <View style={styles.body}>
        <GenericErrorView error={error} />
        <Button
          event="FirmwareUpdateFailureRetry"
          type="primary"
          onPress={onRetry}
          title={<Trans i18nKey="common.retry" />}
          containerStyle={styles.button}
        />
        <Button
          event="FirmwareUpdateFailureClose"
          type="lightSecondary"
          onPress={onClose}
          title={<Trans i18nKey="common.close" />}
          containerStyle={styles.button}
        />
      </View>
      <View style={[styles.footer, { borderColor: colors.lightFog }]}>
        <NeedHelp />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    padding: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});
