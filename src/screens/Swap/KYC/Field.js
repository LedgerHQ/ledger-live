// @flow

import React from "react";
import { StyleSheet, TextInput } from "react-native";

import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import TextInputMask from "react-native-text-input-mask";
import LText from "../../../components/LText";

const Field = ({
  field,
  onChange,
  isLoading,
  mask,
  validate,
  error,
}: {
  field: string,
  onChange: string => void,
  isLoading?: boolean,
  mask?: string,
  validate?: boolean,
  error?: string,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const color = colors.text;
  const borderColor = colors.fog;

  return (
    <>
      <LText style={styles.label} color={"smoke"}>
        <Trans i18nKey={`transfer.swap.kyc.wyre.form.${field}`} />
      </LText>
      {!mask ? (
        <TextInput
          style={[styles.input, { color, borderColor }]}
          editable={!isLoading}
          placeholderTextColor={colors.smoke}
          placeholder={t(`transfer.swap.kyc.wyre.form.${field}Placeholder`)}
          onChangeText={onChange}
          clearButtonMode="while-editing"
          maxLength={30}
        />
      ) : (
        <TextInputMask
          style={[styles.input, { color, borderColor }]}
          placeholderTextColor={colors.smoke}
          placeholder={t("transfer.swap.kyc.wyre.form.dateOfBirthPlaceholder")}
          onChangeText={onChange}
          mask={"[0000]-[00]-[00]"}
        />
      )}
      <LText color={"alert"}>
        {error && validate && (
          <Trans i18nKey={`transfer.swap.kyc.wyre.form.${field}Error`} />
        )}
      </LText>
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "black",
    minHeight: 52,
    borderRadius: 4,
    padding: 16,
    fontSize: 14,
    flex: 1,
  },
});

export default Field;
