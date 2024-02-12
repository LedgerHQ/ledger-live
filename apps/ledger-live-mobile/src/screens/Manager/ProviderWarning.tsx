import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import Alert from "~/components/Alert";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";

const ProviderWarning = () => {
  const forcedProvider = useEnv("FORCE_PROVIDER");
  const devMode = useEnv("MANAGER_DEV_MODE");
  const oddProvider = forcedProvider !== 1;

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

  return oddProvider || devMode ? (
    <Flex mt={4}>
      <Alert
        type="warning"
        learnMoreIsInternal
        learnMoreKey="settings.experimental.providerCTA"
        onLearnMore={onLearnMore}
      >
        {oddProvider
          ? devMode
            ? t("settings.experimental.providerDevMode", { forcedProvider })
            : t("settings.experimental.provider", { forcedProvider })
          : t("settings.experimental.devMode", { forcedProvider })}
      </Alert>
    </Flex>
  ) : null;
};

export default ProviderWarning;
