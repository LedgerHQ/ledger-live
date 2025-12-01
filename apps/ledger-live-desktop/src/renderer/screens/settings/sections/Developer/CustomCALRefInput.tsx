import React, { useCallback, useEffect, useState } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import Track from "~/renderer/analytics/Track";
import Input from "~/renderer/components/Input";
import { Switch, Button } from "@ledgerhq/ldls-ui-react";
import Box from "~/renderer/components/Box";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { prepareCurrency } from "~/renderer/bridge/cache";

const CustomCALRefInput = () => {
  const { t } = useTranslation();
  const ref = useEnv("CAL_REF");
  const [inputValue, setInputValue] = useState(ref || "branch:next");
  const [buttonIsDisabled, setButtonIsDisabled] = useState(ref === inputValue || inputValue === "");
  const [enableCustomRef, setEnableCustomRef] = useState(!!ref);

  useEffect(() => {
    setButtonIsDisabled(ref === inputValue || inputValue === "");
  }, [ref, inputValue]);

  const updateRef = useCallback((ref: string) => {
    setEnv("CAL_REF", ref);
    const currenciesToUpdate = ["solana"];
    for (const currency of currenciesToUpdate) {
      prepareCurrency(getCryptoCurrencyById(currency), { forceUpdate: true });
    }
  }, []);

  const handleOnClick = useCallback(() => {
    updateRef(inputValue);
  }, [inputValue, updateRef]);

  const handleOnChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleOnChangeSwitch = useCallback(() => {
    if (enableCustomRef) {
      setEnableCustomRef(false);
      updateRef("");
    } else {
      setEnableCustomRef(true);
      updateRef(inputValue);
    }
  }, [enableCustomRef, inputValue, updateRef]);

  return (
    <>
      <Track onUpdate event="CustomCALRefInput" currentBranch={ref} />
      <Box grow horizontal flow={2} alignItems="center">
        {enableCustomRef ? (
          <>
            <Input
              small
              style={{ minWidth: 200, maxWidth: 500, width: "100%" }}
              isSearchable={false}
              onChange={handleOnChange}
              value={inputValue}
              data-testid="custom-cal-ref-input"
            />
            <Button
              disabled={buttonIsDisabled}
              size="sm"
              appearance="accent"
              onClick={handleOnClick}
              data-testid="custom-cal-ref-button"
            >
              {t("common.apply")}
            </Button>
          </>
        ) : null}

        <Switch selected={enableCustomRef} onChange={handleOnChangeSwitch} />
      </Box>
    </>
  );
};

export default CustomCALRefInput;
