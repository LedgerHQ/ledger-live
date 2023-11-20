import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import Alert from "~/renderer/components/Alert";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";

const ProviderWarning = () => {
  const forcedProvider = useEnv("FORCE_PROVIDER");
  const devMode = useEnv("MANAGER_DEV_MODE");
  const oddProvider = forcedProvider !== 1;

  const { t } = useTranslation();
  const history = useHistory();

  const onLearnMore = useCallback(() => {
    history.push("/settings/experimental");
  }, [history]);

  return oddProvider || devMode ? (
    <Alert
      type="warning"
      title={
        oddProvider
          ? devMode
            ? t("settings.experimental.providerDevMode", { forcedProvider })
            : t("settings.experimental.provider", { forcedProvider })
          : t("settings.experimental.devMode", { forcedProvider })
      }
      learnMoreLabel={t("settings.experimental.providerCTA")}
      learnMoreIsInternal
      onLearnMore={onLearnMore}
    />
  ) : null;
};

export default ProviderWarning;
