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
  card: Object,
  t: T,
};

export default class ExchangeCard extends Component<Props> {
  onClick = () => {
    const { card } = this.props;
    Linking.openURL(card.url).catch(err =>
      console.error("An error occurred", err),
    );
  };

  render() {
    const {
      card: { logo, id },
      t,
    } = this.props;

    return (
      <Card style={styles.cardStyle}>
        <View style={styles.cardTextBlock}>
          <View style={styles.logoContainer}>{logo}</View>
          <LText style={styles.description}>{t(`exchange.${id}`)}</LText>
          <View>
            <Button
              type="tertiary"
              title={<Trans i18nKey="exchange.visit" />}
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
