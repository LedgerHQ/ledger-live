import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import Alert from "~/renderer/components/Alert";
import useEnv from "~/renderer/hooks/useEnv";

const ProviderWarning = () => {
  const forcedProvider = useEnv("FORCE_PROVIDER");
  const { t } = useTranslation();
  const history = useHistory();

  const onLearnMore = useCallback(() => {
    history.push("/settings/experimental");
  }, [history]);

  return forcedProvider !== 1 ? (
    <Alert
      type="warning"
      title={t("settings.experimental.provider", { forcedProvider })}
      learnMoreLabel={t("settings.experimental.providerCTA")}
      learnMoreIsInternal
      onLearnMore={onLearnMore}
    />
  ) : null;
};

export default ProviderWarning;
