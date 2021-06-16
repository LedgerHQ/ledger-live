/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import Share from "react-native-share";
import { Trans } from "react-i18next";
import VersionNumber from "react-native-version-number";
import LText from "./LText";
import ErrorIcon from "./ErrorIcon";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import logger from "../logger";
import logReport from "../log-report";
import Button from "./Button";
import DownloadFileIcon from "../icons/DownloadFile";
import cleanBuildVersion from "../logic/cleanBuildVersion";

class GenericErrorView extends PureComponent<{
  error: Error,
  // sometimes we want to "hide" the technical error into a category
  // for instance, for Genuine check we want to express "Genuine check failed" because "<actual error>"
  // in such case, the outerError is GenuineCheckFailed and the actual error is still error
  outerError?: ?Error,
  withDescription: boolean,
  withIcon: boolean,
  hasExportLogButton?: boolean,
}> {
  static defaultProps = {
    withDescription: true,
    withIcon: true,
  };

  onExport = async () => {
    const logs = logReport.getLogs();
    const base64 = Buffer.from(JSON.stringify(logs)).toString("base64");
    const { appVersion, buildVersion } = VersionNumber;
    const version = `${appVersion || ""}-(${cleanBuildVersion(buildVersion) ||
      ""})`;
    const date = new Date().toISOString().split("T")[0];

    const humanReadableName = `ledger-live-mob-${version}-${date}-logs`;

    const options = {
      failOnCancel: false,
      saveToFiles: true,
      type: "application/json",
      filename: humanReadableName,
      url: `data:application/json;base64,${base64}`,
    };

    try {
      await Share.open(options);
    } catch (err) {
      if (err.error.code !== "ECANCELLED500") {
        logger.critical(err);
      }
    }
  };
  render() {
    const { error, outerError, withDescription, withIcon } = this.props;
    const titleError = outerError || error;
    const subtitleError = outerError ? error : null;
    const hasExportLogButton = this.props.hasExportLogButton !== false; // hasExportLogButton is true by default

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
              onPress={this.onExport}
            />
          </>
        ) : null}
      </View>
    );
  }
}

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
