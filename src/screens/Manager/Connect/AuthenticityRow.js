/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { withNavigation } from "react-navigation";
import LText from "../../../components/LText";
import colors from "../../../colors";
import Check from "../../../icons/Check";
import Row from "./Row";

type Props = {
  navigation: *,
};

class AuthenticityRow extends PureComponent<Props> {
  render() {
    return (
      <Row title={<Trans i18nKey="AuthenticityRow.title" />} compact>
        <View style={styles.container}>
          <LText numberOfLines={1} style={styles.version}>
            <Trans i18nKey="AuthenticityRow.subtitle" />
          </LText>
          <View style={styles.iconContainer}>
            <Check size={12} color={colors.white} />
          </View>
        </View>
      </Row>
    );
  }
}

export default withNavigation(AuthenticityRow);

const styles = StyleSheet.create({
  version: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 50,
    backgroundColor: colors.live,
  },
});
