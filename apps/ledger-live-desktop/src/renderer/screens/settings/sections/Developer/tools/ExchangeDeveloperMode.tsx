import React, { useEffect, useState } from "react";
import { setEnv, getEnv } from "@ledgerhq/live-env";
import { setTestProviderInfo } from "@ledgerhq/live-common/exchange/providers/index";
import Input from "~/renderer/components/Input";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import DeveloperToggleInputRow from "../components/DeveloperToggleInputRow";

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

  const handleChangeSwitch = (enabled: boolean) => {
    setEnableExchangeDevMode(enabled);
    setProviderInfo("");
    setButtonIsDisabled(true);
  };

  return (
    <DeveloperToggleInputRow
      title={t("settings.developer.exchangeDeveloperMode.title")}
      desc={t("settings.developer.exchangeDeveloperMode.desc")}
      isEnabled={enableExchangeDevMode}
      onToggle={handleChangeSwitch}
    >
      <Input
        small
        style={{ minWidth: 200, maxWidth: 500, width: "100%" }}
        onChange={handleProviderInfo}
        value={providerInfo}
        placeholder={t("settings.developer.exchangeDeveloperMode.placeholder")}
      />
      <Button
        disabled={buttonIsDisabled}
        size="sm"
        appearance="accent"
        onClick={handleOnClickApplyProvider}
      >
        {t("common.apply")}
      </Button>
    </DeveloperToggleInputRow>
  );
};

export default ExchangeDeveloperMode;
