/* @flow */

import React, { Component } from "react";
import { View, StyleSheet, Platform, Linking } from "react-native";
import { Trans } from "react-i18next";
import colors from "../colors";
import Button from "./Button";
import type { T } from "../types/common";
import LText from "./LText";
import Card from "./Card";

type Props = {
  card: *,
  t: T,
};

export default class PartnerCard extends Component<Props> {
  onClick = () => Linking.openURL(this.props.card.url);

  render() {
    const {
      card: { Logo, url, id },
      t,
    } = this.props;

    return (
      <Card style={styles.cardStyle}>
        <View style={styles.cardTextBlock}>
          <View style={styles.logoContainer}>
            <Logo />
          </View>
          <LText style={styles.description}>{t(`partners.${id}`)}</LText>
          <View>
            <Button
              event="OpenPartner"
              eventProperties={{ partner: id, partnerUrl: url }}
              type="tertiary"
              title={<Trans i18nKey="partners.visit" />}
              onPress={this.onClick}
            />
          </View>
        </View>
      </Card>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainerStyle: {
    marginTop: 24,
  },
  cardStyle: {
    backgroundColor: colors.white,
    overflow: "visible",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginVertical: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  logoContainer: {
    alignItems: "center",
  },
  cardTextBlock: {
    flexDirection: "column",
    flex: 1,
  },
  title: {
    color: colors.darkBlue,
    fontSize: 16,
    lineHeight: 17,
    marginBottom: 4,
  },
  description: {
    color: colors.grey,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
    marginTop: 24,
  },
});
