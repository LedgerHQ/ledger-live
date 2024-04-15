import React, { useEffect, useState } from "react";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { setTestProviderInfo } from "@ledgerhq/live-common/exchange/providers/index";
import Input from "~/renderer/components/Input";
import Switch from "~/renderer/components/Switch";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "../../SettingsSection";

const ExchangeDeveloperMode = () => {
  const { t } = useTranslation();
  const [providerInfo, setProviderInfo] = useState("");
  const [buttonIsDisabled, setButtonIsDisabled] = useState<boolean>(providerInfo === "");
  const [enableExchangeDevMode, setEnableExchangeDevMode] = useState<boolean>(false);

  useEffect(() => {
    setEnableExchangeDevMode(getEnv("MOCK_EXCHANGE_TEST_CONFIG"));
  }, []);

  useEffect(() => {
    setEnv("MOCK_EXCHANGE_TEST_CONFIG", enableExchangeDevMode);
  }, [enableExchangeDevMode]);

  const handleOnClickApplyProvider = () => {
    setTestProviderInfo(providerInfo);
    setButtonIsDisabled(true);
  };

  const handleProviderInfo = (value: string) => {
    setProviderInfo(value);
    setButtonIsDisabled(providerInfo === value || value === "");
  };

  const handleChangeSwitch = () => {
    setEnableExchangeDevMode(!enableExchangeDevMode);
    setProviderInfo("");
    setButtonIsDisabled(true);
  };

  return (
    <SettingsSectionRow title="Exchange Dev Mode" desc="Add exchange provider's info">
      <Box grow horizontal flow={2} alignItems="center">
        {enableExchangeDevMode ? (
          <>
            <Input
              small
              style={{ minWidth: 200, maxWidth: 500, width: "100%" }}
              isSearchable={false}
              onChange={handleProviderInfo}
              value={providerInfo}
              placeholder="Exchange provider's info in CAL format"
            ></Input>
            <Button
              disabled={buttonIsDisabled}
              small
              primary
              onClick={handleOnClickApplyProvider}
              style={{ minWidth: 64, display: "flex", justifyContent: "center" }}
            >
              {t("common.apply")}
            </Button>
          </>
        ) : null}

        <Switch isChecked={enableExchangeDevMode} onChange={handleChangeSwitch} />
      </Box>
    </SettingsSectionRow>
  );
};

export default ExchangeDeveloperMode;
