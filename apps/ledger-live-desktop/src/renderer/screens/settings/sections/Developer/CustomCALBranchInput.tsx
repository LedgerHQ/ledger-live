import React, { useCallback, useEffect, useState } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import Track from "~/renderer/analytics/Track";
import Input from "~/renderer/components/Input";
import Switch from "~/renderer/components/Switch";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { prepareCurrency } from "~/renderer/bridge/cache";

const CustomCALBranchInput = () => {
  const { t } = useTranslation();
  const branch = useEnv("CAL_BRANCH");
  const [inputValue, setInputValue] = useState(branch || "branch:next");
  const [buttonIsDisabled, setButtonIsDisabled] = useState(
    branch === inputValue || inputValue === "",
  );
  const [enableCustomBranch, setEnableCustomBranch] = useState(!!branch);

  useEffect(() => {
    setButtonIsDisabled(branch === inputValue || inputValue === "");
  }, [branch, inputValue]);

  const handleOnClick = useCallback(() => {
    setEnv("CAL_BRANCH", inputValue);
    prepareCurrency(getCryptoCurrencyById("solana"), true);
  }, [inputValue]);

  const handleOnChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleOnChangeSwitch = useCallback(() => {
    if (enableCustomBranch) {
      setEnableCustomBranch(false);
      setEnv("CAL_BRANCH", "");
      prepareCurrency(getCryptoCurrencyById("solana"), true);
    } else {
      setEnableCustomBranch(true);
      setEnv("CAL_BRANCH", inputValue);
      prepareCurrency(getCryptoCurrencyById("solana"), true);
    }
  }, [enableCustomBranch, inputValue]);

  return (
    <>
      <Track onUpdate event="CustomCALBranchInput" currentBranch={branch} />
      <Box grow horizontal flow={2} alignItems="center">
        {enableCustomBranch ? (
          <>
            <Input
              small
              style={{ minWidth: 200, maxWidth: 500, width: "100%" }}
              isSearchable={false}
              onChange={handleOnChange}
              value={inputValue}
            />
            <Button
              disabled={buttonIsDisabled}
              small
              primary
              flex
              minWidth={64}
              justifyContent={"center"}
              onClick={handleOnClick}
            >
              {t("common.apply")}
            </Button>
          </>
        ) : null}

        <Switch isChecked={enableCustomBranch} onChange={handleOnChangeSwitch} />
      </Box>
    </>
  );
};

export default CustomCALBranchInput;
