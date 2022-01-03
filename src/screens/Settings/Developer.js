// @flow
import { isEnvDefault } from "@ledgerhq/live-common/lib/env";
import React from "react";
import { ScrollView } from "react-native";
import { developerFeatures } from "../../experimental";
import { TrackScreen } from "../../analytics";
import FeatureRow from "./Experimental/FeatureRow";

export default function DeveloperSettings() {
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
    </ScrollView>
  );
}
