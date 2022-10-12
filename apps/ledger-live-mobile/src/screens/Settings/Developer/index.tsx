import { NavigationProp } from "@react-navigation/native";
import { isEnvDefault } from "@ledgerhq/live-common/env";
import React from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import { ScreenName } from "../../../const";
import { developerFeatures } from "../../../experimental";
import { TrackScreen } from "../../../analytics";
import FeatureRow from "../Experimental/FeatureRow";

export { default as DeveloperCustomManifest } from "./CustomManifest";
export default function DeveloperSettings({
  navigation,
}: {
  navigation: NavigationProp;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView>
      <TrackScreen category="Settings" name="Developer" />

      {developerFeatures.map(
        feat =>
          (!feat.shadow || (feat.shadow && !isEnvDefault(feat.name))) && ( // $FlowFixMe
            <FeatureRow key={feat.name} feature={feat} />
          ),
      )}

      <SettingsRow
        title={t(
          "settings.experimental.developerFeatures.platformManifest.title",
        )}
        onPress={() => navigation.navigate(ScreenName.DeveloperCustomManifest)}
      />
    </ScrollView>
  );
}
