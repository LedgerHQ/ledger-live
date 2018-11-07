/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../components/LText";
import colors from "../../colors";
import Touchable from "../../components/Touchable";
import ExternalLink from "../../icons/ExternalLink";

type Props = {
  url: string,
};

class Footer extends PureComponent<Props, *> {
  render() {
    const { url } = this.props;

    return (
      <View style={styles.footer}>
        <View style={{ justifyContent: "center" }}>
          <Touchable
            onPress={() =>
              Linking.openURL(url).catch(err =>
                console.error("An error occurred", err),
              )
            }
          >
            <View style={{ flexDirection: "row" }}>
              <ExternalLink color={colors.live} size={20} />
              <LText style={{ color: colors.live, marginLeft: 8 }}>
                <Trans i18nKey="operationDetails.viewInExplorer" />
              </LText>
            </View>
          </Touchable>
        </View>
      </View>
    );
  }
}

export default Footer;

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
});
