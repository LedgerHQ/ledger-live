// @flow

import React, { Component } from "react";
import { Trans, translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import partners from "@ledgerhq/live-common/lib/partners/reactNative";
import type { NavigationScreenProp } from "react-navigation";
import type { T } from "../../types/common";
import PartnerCard from "../../components/PartnerCard";
import LText from "../../components/LText";
import colors from "../../colors";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";

const forceInset = { bottom: "always" };

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
      <SafeAreaView
        style={[styles.root, { paddingTop: extraStatusBarPadding }]}
        forceInset={forceInset}
      >
        <TrackScreen category="Partners" />
        <ScrollView style={styles.scrollView}>
          <View style={styles.body}>
            <LText secondary style={styles.title} bold>
              <Trans i18nKey="partners.title" />
            </LText>
            <LText secondary style={styles.description} numberOfLines={2}>
              <Trans i18nKey="partners.subtitle" />
            </LText>
            {partners.map(card => (
              <PartnerCard icon={card.Logo} key={card.id} t={t} card={card} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  scrollView: {
    paddingTop: 24,
    flex: 1,
  },
  body: {
    overflow: "visible",
    paddingHorizontal: 16,
    paddingBottom: 64,
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
