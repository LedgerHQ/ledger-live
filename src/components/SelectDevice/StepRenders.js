// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import LText from "../LText";
import TranslatedError from "../TranslatedError";
import ErrorIcon from "../ErrorIcon";
import Button from "../Button";
import colors from "../../colors";

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
      <View style={styles.headIcon}>
        <ErrorIcon error={error} />
      </View>
      <LText secondary semiBold style={styles.title}>
        <TranslatedError error={error} />
      </LText>
      <LText style={styles.description}>
        <TranslatedError error={error} field="description" />
      </LText>
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
  description: React$Node,
  children?: React$Node,
}) => (
  <View style={styles.root}>
    <View style={styles.body}>
      <View style={styles.headIcon}>{icon}</View>
      <LText secondary semiBold style={styles.title}>
        {title}
      </LText>
      <LText style={styles.description}>{description}</LText>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    minHeight: 280,
    paddingHorizontal: 20,
  },
  body: {
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  headIcon: {
    padding: 10,
  },
  title: {
    paddingVertical: 20,
    fontSize: 16,
    color: colors.darkBlue,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    paddingHorizontal: 40,
  },
  retryButton: {
    alignSelf: "stretch",
  },
});
