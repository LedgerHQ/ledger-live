import React, { useState } from "react";
import Track from "~/renderer/analytics/Track";
import Input from "~/renderer/components/Input";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import Switch from "~/renderer/components/Switch";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import Loader from "~/renderer/icons/Loader";
import api from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/api/index";

const CatalogProviderInput = () => {
  const { provider, setProvider } = useRemoteLiveAppContext();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>(provider === "production" ? "" : provider);
  const [buttonIsDisabled, setButtonIsDisabled] = useState<boolean>(
    provider === inputValue || inputValue === "",
  );
  const [enableCustomProvider, setEnableCustomProvider] = useState<boolean>(
    provider !== "production",
  );
  const [isLoading, setIsloading] = useState<boolean>(false);

  const checkProvider = async (customProvider: string) => {
    try {
      const response = await api.fetchLiveAppManifests(customProvider);
      if (response.length === 0) throw new Error("Invalid URL");
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleOnClickApplyProvider = () => {
    setProvider(inputValue);
    setButtonIsDisabled(true);
  };

  const handleOnChange = async (value: string) => {
    setInputValue(value);
    setButtonIsDisabled(provider === value || value === "");
    setIsloading(true);
    const validProvider = await checkProvider(value);
    setButtonIsDisabled(!validProvider);
    setIsloading(false);
  };

  const handleChangeSwitch = () => {
    setEnableCustomProvider(!enableCustomProvider);
    setProvider("production");
    setInputValue("");
    setButtonIsDisabled(true);
  };

  return (
    <>
      <Track onUpdate event="CatalogProviderInout" currentProvider={provider} />
      <Box grow horizontal flow={2} alignItems="center">
        {enableCustomProvider ? (
          <>
            <Input
              small
              style={{ minWidth: 200, maxWidth: 500, width: "100%" }}
              isSearchable={false}
              onChange={handleOnChange}
              value={inputValue}
            ></Input>
            <Button
              disabled={buttonIsDisabled || isLoading}
              small
              primary
              onClick={handleOnClickApplyProvider}
              style={{ minWidth: 64, display: "flex", justifyContent: "center" }}
            >
              {isLoading ? <Loader style={{ margin: "auto" }} size={14} /> : t("common.apply")}
            </Button>
          </>
        ) : null}

        <Switch isChecked={enableCustomProvider} onChange={handleChangeSwitch} />
      </Box>
    </>
  );
};

export default CatalogProviderInput;
