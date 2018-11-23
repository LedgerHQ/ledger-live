// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import GenericSuccessView from "../GenericSuccessView";
import GenericErrorView from "../GenericErrorView";
import Button from "../Button";

export const ErrorFooterGeneric = ({ onRetry }: { onRetry: () => void }) => (
  <Button
    type="secondary"
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
  <View style={styles.root}>
    <View style={styles.body}>
      <GenericErrorView error={error} />
    </View>
    <Footer onRetry={onRetry} />
  </View>
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
  <View style={styles.root}>
    <View style={styles.body}>
      <GenericSuccessView icon={icon} title={title} description={description} />
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    paddingHorizontal: 20,
  },
  body: {
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  retryButton: {
    alignSelf: "stretch",
  },
});
