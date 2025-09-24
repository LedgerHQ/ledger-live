import React, { memo, useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "~/components/LText";
import KeyboardView from "~/components/KeyboardView";
import TranslatedError from "~/components/TranslatedError";
import PasswordInput from "~/components/PasswordInput";
import Button from "~/components/wrappedUi/Button";
import SafeAreaView from "~/components/SafeAreaView";
import { useIsFocused } from "@react-navigation/native";

type Props = {
  onChange: (_: string) => void;
  onSubmit: () => void;
  error?: Error | null;
  placeholder: string;
  value: string;
};

const PasswordForm = ({ onChange, onSubmit, error, placeholder, value }: Props) => {
  // This is to force the keyboard view to re-render when the screen is focused. When
  // transitioning from AddPassword to ConfirmPassword, the keyboard is displayed but
  // the keyboard view is not re-rendered so we lose layout adjustments.
  const isFocused = useIsFocused();
  const kavKey = isFocused ? "focused" : "blurred";
  const { t } = useTranslation();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const toggleSecureTextEntry = useCallback(() => {
    setSecureTextEntry(active => !active);
  }, []);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.root}>
      <KeyboardView key={kavKey} style={{ flex: 1 }}>
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
    padding: 16,
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
