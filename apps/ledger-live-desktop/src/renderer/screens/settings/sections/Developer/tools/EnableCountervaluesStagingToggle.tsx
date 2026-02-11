import React, { useEffect, useState } from "react";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { Switch } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const EnableCountervaluesStagingToggle = () => {
  const { t } = useTranslation();
  const STAGING_URL = getEnv("LEDGER_COUNTERVALUES_API_STAGING");
  const PRODUCTION_URL = getEnv("LEDGER_COUNTERVALUES_API");
  const [enableStaging, setEnableStaging] = useState<boolean>(false);

  useEffect(() => {
    const currentUrl = getEnv("LEDGER_COUNTERVALUES_API");
    setEnableStaging(currentUrl === STAGING_URL);
  }, [STAGING_URL]);

  useEffect(() => {
    setEnv("LEDGER_COUNTERVALUES_API", enableStaging ? STAGING_URL : PRODUCTION_URL);
  }, [enableStaging, STAGING_URL, PRODUCTION_URL]);

  const handleChangeSwitch = () => {
    setEnableStaging(!enableStaging);
  };

  return (
    <DeveloperClassicRow
      title={t("settings.developer.enableCountervaluesStaging")}
      desc={t("settings.developer.enableCountervaluesStagingDesc")}
    >
      <Switch
        selected={enableStaging}
        onChange={handleChangeSwitch}
        data-testid="settings-enable-countervalues-staging"
      />
    </DeveloperClassicRow>
  );
};

export default EnableCountervaluesStagingToggle;
