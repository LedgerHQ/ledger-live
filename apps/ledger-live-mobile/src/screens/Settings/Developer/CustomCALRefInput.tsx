import React, { useCallback, useEffect, useState } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import { Box } from "@ledgerhq/native-ui";
import TextInput from "~/components/FocusedTextInput";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { prepareCurrency } from "~/bridge/cache";
import { useTheme } from "@react-navigation/native";
import Switch from "~/components/Switch";
import Button from "~/components/Button";
import { StyleSheet } from "react-native";

const CustomCALRefInput = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
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
    <Box style={styles.box}>
      <Switch
        testID="custom-cal-ref-switch"
        value={enableCustomRef}
        onValueChange={handleOnChangeSwitch}
        label={t(`settings.developer.customCALRef.${enableCustomRef ? "disable" : "enable"}`)}
      />

      {enableCustomRef ? (
        <>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
              },
            ]}
            onChangeText={handleOnChange}
            value={inputValue}
            testID="custom-cal-ref-input"
          />
          <Button type="primary" disabled={buttonIsDisabled} onPress={handleOnClick}>
            {t("common.apply")}
          </Button>
        </>
      ) : null}
    </Box>
  );
};

const styles = StyleSheet.create({
  box: {
    margin: 16,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginVertical: 16,
  },
});

export default CustomCALRefInput;
