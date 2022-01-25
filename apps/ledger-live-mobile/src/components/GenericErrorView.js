/* @flow */
import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import useExportLogs from "./useExportLogs";
import LText from "./LText";
import ErrorIcon from "./ErrorIcon";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import Button from "./Button";
import DownloadFileIcon from "../icons/DownloadFile";

const GenericErrorView = ({
  error,
  outerError,
  withDescription = true,
  withIcon = true,
  hasExportLogButton = true,
}: {
  error: Error,
  // sometimes we want to "hide" the technical error into a category
  // for instance, for Genuine check we want to express "Genuine check failed" because "<actual error>"
  // in such case, the outerError is GenuineCheckFailed and the actual error is still error
  outerError?: ?Error,
  withDescription?: boolean,
  withIcon?: boolean,
  hasExportLogButton?: boolean,
}) => {
  const onExport = useExportLogs();

  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  return (
    <View style={styles.root}>
      {withIcon ? (
        <View style={styles.headIcon}>
          <ErrorIcon error={error} />
        </View>
      ) : null}
      <LText selectable semiBold style={styles.title} numberOfLines={3}>
        <TranslatedError error={titleError} />
      </LText>
      {subtitleError ? (
        <LText
          selectable
          secondary
          semiBold
          style={styles.subtitle}
          color="alert"
          numberOfLines={3}
        >
          <TranslatedError error={subtitleError} />
        </LText>
      ) : null}
      {withDescription ? (
        <>
          <LText
            selectable
            style={styles.description}
            color="smoke"
            numberOfLines={6}
          >
            <TranslatedError error={error} field="description" />
          </LText>
          <SupportLinkError error={error} />
        </>
      ) : null}
      {hasExportLogButton ? (
        <>
          <Button
            type="lightSecondary"
            containerStyle={styles.savelogsButton}
            title={<Trans i18nKey="common.saveLogs" />}
            IconLeft={DownloadFileIcon}
            onPress={onExport}
          />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    alignItems: "center",
    marginVertical: 24,
  },
  headIcon: {
    padding: 10,
  },
  title: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    lineHeight: 26,
    fontSize: 16,

    textAlign: "center",
  },
  subtitle: {
    marginTop: -20,
    paddingBottom: 20,
    paddingHorizontal: 40,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  savelogsButton: {
    marginTop: 10,
  },
});

export default GenericErrorView;
