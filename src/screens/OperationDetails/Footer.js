/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../colors";
import ExternalLink from "../../icons/ExternalLink";
import Button from "../../components/Button";

type Props = {
  url: string,
};

class Footer extends PureComponent<Props, *> {
  onPress = () =>
    Linking.openURL(this.props.url).catch(err =>
      console.error("An error occurred", err),
    );

  render() {
    return (
      <View style={styles.footer}>
        <Button
          event="OperationDetailViewInExplorer"
          type="lightSecondary"
          title={<Trans i18nKey="operationDetails.viewInExplorer" />}
          IconLeft={ExternalLink}
          onPress={this.onPress}
        />
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
