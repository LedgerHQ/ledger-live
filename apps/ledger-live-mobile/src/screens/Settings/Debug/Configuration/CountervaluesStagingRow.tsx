import React, { useCallback, useEffect, useState } from "react";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";

const CountervaluesStagingRow = () => {
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

  const handleToggle = useCallback(() => {
    setEnableStaging(prev => !prev);
  }, []);

  return (
    <SettingsRow
      title="Countervalues API staging"
      desc="Toggle between production and staging countervalues (CVS) API."
    >
      <Switch value={enableStaging} onValueChange={handleToggle} />
    </SettingsRow>
  );
};

export default CountervaluesStagingRow;
