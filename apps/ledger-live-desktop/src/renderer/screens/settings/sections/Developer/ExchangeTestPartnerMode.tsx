import React, { useState } from "react";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import Switch from "~/renderer/components/Switch";
import Box from "~/renderer/components/Box";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "../../SettingsSection";

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
    <SettingsSectionRow
      title={t("settings.developer.exchangeTestPartnerMode.title")}
      desc={t("settings.developer.exchangeTestPartnerMode.desc")}
    >
      <Box grow horizontal flow={2} alignItems="center">
        <Switch isChecked={enableExchangeTestPartnerMode} onChange={handleChangeSwitch} />
      </Box>
    </SettingsSectionRow>
  );
};

export default ExchangeTestPartnerMode;
