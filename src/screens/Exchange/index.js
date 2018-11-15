// @flow

import React, { Component } from "react";
import { Trans, translate } from "react-i18next";
import { SafeAreaView, ScrollView, View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { T } from "../../types/common";
import ExchangeCard from "../../components/ExchangeCard";
import LText from "../../components/LText";
import colors from "../../colors";
import exchanges from "../../config/exchange";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";

type Props = {
  navigation: NavigationScreenProp<*>,
  t: T,
};

class ExchangeScreen extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  render() {
    const { t } = this.props;
    return (
      <View style={[styles.root, { paddingTop: extraStatusBarPadding }]}>
        <SafeAreaView style={styles.inner}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.root}>
              <LText secondary style={styles.title} bold>
                <Trans i18nKey="exchange.title" />
              </LText>
              <LText secondary style={styles.description} numberOfLines={2}>
                <Trans i18nKey="exchange.subtitle" />
              </LText>
              {exchanges.map(card => (
                <ExchangeCard
                  icon={card.icon}
                  key={card.key}
                  t={t}
                  card={card}
                />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  scrollView: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 64,
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  description: {
    marginTop: 5,
    marginBottom: 24,
    fontSize: 14,
    color: colors.grey,
  },
});

export default translate()(ExchangeScreen);
