import { isEnvDefault } from "@ledgerhq/live-env";
import React from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import { developerFeatures } from "../../../experimental";
import { TrackScreen } from "~/analytics";
import FeatureRow from "../Experimental/FeatureRow";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

export { default as DeveloperCustomManifest } from "./CustomManifest";
export { default as ExchangeDeveloperMode } from "./ExchangeDeveloperMode";
export default function DeveloperSettings({
  navigation,
}: StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DeveloperSettings>) {
  const { t } = useTranslation();
  return (
    <ScrollView>
      <TrackScreen category="Settings" name="Developer" />

      {developerFeatures.map(
        feat =>
          (!feat.shadow || (feat.shadow && !isEnvDefault(feat.name))) && (
            <FeatureRow key={feat.name} feature={feat} />
          ),
      )}
      <SettingsRow
        title={t("settings.developer.exchangeDeveloperMode.title")}
        desc={t("settings.developer.exchangeDeveloperMode.description")}
        onPress={() => navigation.navigate(ScreenName.ExchangeDeveloperMode)}
      />
      <SettingsRow
        title={t("settings.experimental.developerFeatures.platformManifest.title")}
        onPress={() => navigation.navigate(ScreenName.DeveloperCustomManifest)}
      />
      <SettingsRow
        title={t("settings.developer.customCALRef.title")}
        desc={t("settings.developer.customCALRef.description")}
        onPress={() => navigation.navigate(ScreenName.CustomCALRefInput)}
      />
    </ScrollView>
  );
}
