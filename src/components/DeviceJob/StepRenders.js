// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import GenericSuccessView from "../GenericSuccessView";
import GenericErrorView from "../GenericErrorView";
import Button from "../Button";

const forceInset = { bottom: "always" };

export const ErrorFooterGeneric = ({ onRetry }: { onRetry: () => void }) => (
  <Button
    event="DeviceJobErrorRetry"
    type="primary"
    title={<Trans i18nKey="common.retry" />}
    containerStyle={styles.retryButton}
    onPress={onRetry}
  />
);

export const RenderError = ({
  error,
  onRetry,
  Footer,
}: {
  error: Error,
  onRetry: () => void,
  Footer: React$ComponentType<{ onRetry: () => void }>,
}) => (
  <SafeAreaView forceInset={forceInset} style={styles.root}>
    <View style={styles.body}>
      <GenericErrorView error={error} />
    </View>
    <Footer onRetry={onRetry} />
  </SafeAreaView>
);

RenderError.defaultProps = {
  Footer: ErrorFooterGeneric,
};

export const RenderStep = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React$Node,
  title: React$Node,
  description?: React$Node,
  children?: React$Node,
}) => (
  <SafeAreaView forceInset={forceInset} style={styles.root}>
    <View style={styles.body}>
      <GenericSuccessView icon={icon} title={title} description={description} />
    </View>
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    paddingHorizontal: 16,
  },
  body: {
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
    marginHorizontal: 16,
  },
  retryButton: {
    alignSelf: "stretch",
  },
});
