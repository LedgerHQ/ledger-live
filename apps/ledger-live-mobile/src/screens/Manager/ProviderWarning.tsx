import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../const";
import Alert from "../../components/Alert";
import { BaseNavigation } from "../../components/RootNavigator/types/helpers";

const ProviderWarning = () => {
  const forcedProvider = useEnv("FORCE_PROVIDER");
  const { t } = useTranslation();
  const navigation = useNavigation<BaseNavigation>();

  const onLearnMore = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.ExperimentalSettings,
      },
    });
  }, [navigation]);

  return forcedProvider !== 1 ? (
    <Alert
      type="primary"
      learnMoreIsInternal
      learnMoreKey="settings.experimental.providerCTA"
      onLearnMore={onLearnMore}
    >
      {t("settings.experimental.provider", { forcedProvider })}
    </Alert>
  ) : null;
};

export default ProviderWarning;
