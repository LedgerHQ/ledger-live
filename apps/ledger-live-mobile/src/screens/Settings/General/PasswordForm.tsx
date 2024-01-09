import React, { memo, useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "~/components/LText";
import KeyboardView from "~/components/KeyboardView";
import TranslatedError from "~/components/TranslatedError";
import PasswordInput from "~/components/PasswordInput";
import Button from "~/components/wrappedUi/Button";

type Props = {
  onChange: (_: string) => void;
  onSubmit: () => void;
  error?: Error | null;
  placeholder: string;
  value: string;
};

const PasswordForm = ({ onChange, onSubmit, error, placeholder, value }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const toggleSecureTextEntry = useCallback(() => {
    setSecureTextEntry(active => !active);
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardView>
        <View style={styles.body}>
          <PasswordInput
            inline
            autoFocus
            error={error}
            onChange={onChange}
            onSubmit={onSubmit}
            toggleSecureTextEntry={toggleSecureTextEntry}
            secureTextEntry={secureTextEntry}
            placeholder={placeholder}
            password={value}
            testID="password-text-input"
          />
        </View>
        {error && (
          <LText style={styles.errorStyle} color="alert">
            <TranslatedError error={error} />
          </LText>
        )}
        <View style={styles.footer}>
          <Button
            event="SubmitPassword"
            type={"main"}
            onPress={onSubmit}
            disabled={!!error || value.length === 0}
          >
            {t("common.confirm")}
          </Button>
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
};

export default memo(PasswordForm);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    paddingVertical: 8,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  buttonTitle: {
    fontSize: 16,
  },
  footer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 16,
  },
  errorStyle: {
    marginHorizontal: 16,
    fontSize: 12,
  },
});
