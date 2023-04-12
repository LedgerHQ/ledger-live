import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import MaskInput from "react-native-mask-input";
import LText from "../../../../../../components/LText";

const DIGIT = /\d/;

export function Field({
  field,
  onChange,
  isLoading,
  mask,
  validate,
  error,
}: {
  field: string;
  onChange: (_: string) => void;
  isLoading?: boolean;
  mask?: string;
  validate?: boolean;
  error?: string;
}) {
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
        <MaskInput
          style={[styles.input, { color, borderColor }]}
          placeholderTextColor={colors.smoke}
          placeholder={t("transfer.swap.kyc.wyre.form.dateOfBirthPlaceholder")}
          onChangeText={onChange}
          mask={[
            "[",
            DIGIT,
            DIGIT,
            DIGIT,
            DIGIT,
            "]",
            "-",
            "[",
            DIGIT,
            DIGIT,
            "]",
            "-",
            "[",
            DIGIT,
            DIGIT,
            "]",
          ]}
        />
      )}
      <LText color={"alert"}>
        {error && validate && (
          <Trans i18nKey={`transfer.swap.kyc.wyre.form.${field}Error`} />
        )}
      </LText>
    </>
  );
}

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
