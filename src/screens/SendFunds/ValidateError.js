// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import GenericErrorView from "../../components/GenericErrorView";
import Button from "../../components/Button";
import ExternalLink from "../../components/ExternalLink";

type Props = {
  error: Error,
  onContactUs: () => void,
  onClose: () => void,
  onRetry: () => void,
};

class ValidatError extends PureComponent<Props> {
  render() {
    const { error, onContactUs, onClose, onRetry } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <GenericErrorView error={error} />
          <ExternalLink
            text={<Trans i18nKey="common.contactUs" />}
            onPress={onContactUs}
          />
        </View>
        <View style={styles.actionContainer}>
          <Button
            title={<Trans i18nKey="common.close" />}
            type="secondary"
            containerStyle={{ flex: 1, marginRight: 16 }}
            onPress={onClose}
          />
          <Button
            title={<Trans i18nKey="send.validation.button.retry" />}
            type="primary"
            containerStyle={{ flex: 1 }}
            onPress={onRetry}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default ValidatError;
