import React, { useState } from "react";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { Switch } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const ExchangeTestPartnerMode = () => {
  const { t } = useTranslation();
  const [enableExchangeTestPartnerMode, setEnableExchangeDevMode] = useState<boolean>(
    getEnv("MOCK_EXCHANGE_TEST_PARTNER"),
  );

  const handleChangeSwitch = () => {
    setEnableExchangeDevMode(!enableExchangeTestPartnerMode);
    setEnv("MOCK_EXCHANGE_TEST_PARTNER", !enableExchangeTestPartnerMode);
  };

  return (
    <DeveloperClassicRow
      title={t("settings.developer.exchangeTestPartnerMode.title")}
      desc={t("settings.developer.exchangeTestPartnerMode.desc")}
    >
      <Switch selected={enableExchangeTestPartnerMode} onChange={handleChangeSwitch} />
    </DeveloperClassicRow>
  );
};

export default ExchangeTestPartnerMode;
