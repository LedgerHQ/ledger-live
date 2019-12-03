/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../colors";
import ExternalLink from "../../icons/ExternalLink";
import Button from "../../components/Button";

type Props = {
  url: ?string,
  urlWhatIsThis: ?string,
};

class Footer extends PureComponent<Props, *> {
  render() {
    const { url, urlWhatIsThis } = this.props;
    return (
      <View style={styles.footer}>
        {urlWhatIsThis ? (
          <Button
            event="WhatIsThisOperation"
            type="lightSecondary"
            title={<Trans i18nKey="operationDetails.whatIsThis" />}
            IconLeft={ExternalLink}
            onPress={() => Linking.openURL(urlWhatIsThis)}
          />
        ) : null}
        {url ? (
          <Button
            event="OperationDetailViewInExplorer"
            type="primary"
            title={<Trans i18nKey="operationDetails.viewInExplorer" />}
            onPress={() => Linking.openURL(url)}
          />
        ) : null}
      </View>
    );
  }
}

export default Footer;

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: colors.white,
  },
});
