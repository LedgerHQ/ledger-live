/* @flow */
import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { isEnvDefault } from "@ledgerhq/live-common/lib/env";

import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";

import { experimentalFeatures } from "../../../experimental";
import NavigationScrollView from "../../../components/NavigationScrollView";
import KeyboardView from "../../../components/KeyboardView";
import Alert from "../../../components/Alert";

import FeatureRow from "./FeatureRow";

export default function ExperimentalSettings() {
  const { colors } = useTheme();
  return (
    <>
      <KeyboardView>
        <NavigationScrollView>
          <TrackScreen category="Settings" name="Experimental" />
          <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.disclaimerContainer}>
              <Alert type="security" vertical>
                <Trans i18nKey="settings.experimental.disclaimer" />
              </Alert>
            </View>
            {experimentalFeatures.map(feat =>
              !feat.shadow || (feat.shadow && !isEnvDefault(feat.name)) ? (
                // $FlowFixMe
                <FeatureRow key={feat.name} feature={feat} />
              ) : null,
            )}
          </View>
        </NavigationScrollView>
      </KeyboardView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 64 },
  container: {
    paddingVertical: 16,
  },
  disclaimerContainer: {
    paddingHorizontal: 12,
  },
});
