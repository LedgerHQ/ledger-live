/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import i18next from "i18next";
import { translate } from "react-i18next";
import { isEnvDefault } from "@ledgerhq/live-common/lib/env";

import { TrackScreen } from "../../../analytics";
import colors from "../../../colors";

import Disclaimer from "./Disclaimer";
import { experimentalFeatures } from "../../../experimental";
import FeatureRow from "./FeatureRow";

class ExperimentalSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: i18next.t("settings.experimental.title"),
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <TrackScreen category="Settings" name="Experimental" />
        <View style={styles.container}>
          <Disclaimer />
          {experimentalFeatures.map(
            feat =>
              !feat.shadow || (feat.shadow && !isEnvDefault(feat.name)) ? (
                <FeatureRow key={feat.name} feature={feat} />
              ) : null,
          )}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 64 },
  container: {
    padding: 16,
    backgroundColor: colors.white,
  },
});

export default translate()(ExperimentalSettings);
