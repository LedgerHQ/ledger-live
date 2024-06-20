import React from "react";
import { useTranslation } from "react-i18next";
import { isEnvDefault } from "@ledgerhq/live-env";

import { Alert } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { experimentalFeatures } from "../../../experimental";
import FeatureRow from "./FeatureRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";

export default function ExperimentalSettings() {
  const { t } = useTranslation();

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Experimental" />
      <Alert title={t("settings.experimental.disclaimer")} showIcon={false} />
      {experimentalFeatures.map(feat =>
        !feat.shadow || (feat.shadow && !isEnvDefault(feat.name)) ? (
          <FeatureRow key={feat.name} feature={feat} />
        ) : null,
      )}
    </SettingsNavigationScrollView>
  );
}
