// @flow

import React, { useState } from "react";
import Track from "~/renderer/analytics/Track";
import Input from "~/renderer/components/Input";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import Switch from "~/renderer/components/Switch";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";

const CatalogProviderSelect = () => {
  const { setProvider, provider } = useRemoteLiveAppContext();
  const { t } = useTranslation();
  const [enableCustomProvider, setEnableCustomProvider] = useState<boolean>(
    provider !== "production",
  );
  const [inputValue, setInputValue] = useState<string>(provider === "production" ? "" : provider);

  const handleOnClickApplyProvider = () => {
    setProvider(inputValue);
  };

  const handleChangeSwitch = () => {
    setEnableCustomProvider(!enableCustomProvider);
    setProvider("production");
  };

  return (
    <>
      <Track onUpdate event="CatalogProviderSelect" currentProvider={provider} />
      <Box grow horizontal flow={2} alignItems="center">
        {enableCustomProvider ? (
          <>
            <Input
              small
              style={{ minWidth: 200, maxWidth: 500, width: "100%" }}
              isSearchable={false}
              onChange={value => setInputValue(value)}
              value={inputValue}
            ></Input>
            <Button
              disabled={provider === inputValue}
              small
              primary
              onClick={handleOnClickApplyProvider}
            >
              {t("common.apply")}
            </Button>
          </>
        ) : null}

        <Switch isChecked={enableCustomProvider} onChange={handleChangeSwitch} />
      </Box>
    </>
  );
};

export default CatalogProviderSelect;
