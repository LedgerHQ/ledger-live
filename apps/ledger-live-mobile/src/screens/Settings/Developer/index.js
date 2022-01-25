// @flow
import { NavigationProp } from "@react-navigation/native";
import { isEnvDefault } from "@ledgerhq/live-common/lib/env";
import React from "react";
import { ScrollView } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import { ScreenName } from "../../../const";
import { developerFeatures } from "../../../experimental";
import { TrackScreen } from "../../../analytics";
import FeatureRow from "../Experimental/FeatureRow";

export { default as DeveloperCustomManifest } from "./CustomManifest";

export default function DeveloperSettings({
  navigation,
}: {
  navigation: NavigationProp,
}) {
  return (
    <ScrollView>
      <TrackScreen category="Settings" name="Developer" />

      {developerFeatures.map(
        feat =>
          (!feat.shadow || (feat.shadow && !isEnvDefault(feat.name))) && (
            // $FlowFixMe
            <FeatureRow key={feat.name} feature={feat} />
          ),
      )}

      <SettingsRow
        title="Load Platform Manifest"
        onPress={() => navigation.navigate(ScreenName.DeveloperCustomManifest)}
      />
    </ScrollView>
  );
}
