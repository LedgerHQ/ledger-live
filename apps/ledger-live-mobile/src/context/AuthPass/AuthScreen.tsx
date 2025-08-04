import React, { useState, useCallback } from "react";
import { withTranslation, useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { compose } from "redux";
import { Flex, Logos } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import type { TFunction } from "react-i18next";
import type { Privacy } from "~/reducers/types";
import { withReboot } from "../Reboot";
import LText from "~/components/LText";
import TranslatedError from "~/components/TranslatedError";
import { BaseButton } from "~/components/Button";
import PoweredByLedger from "~/screens/Settings/PoweredByLedger";
import QueuedDrawer from "~/components/QueuedDrawer";
import HardResetModal from "~/components/HardResetModal";
import Touchable from "~/components/Touchable";
import PasswordInput from "~/components/PasswordInput";
import KeyboardView from "~/components/KeyboardView";
import FailBiometrics from "./FailBiometrics";
import SafeKeyboardView from "~/components/KeyboardBackgroundDismiss";
import { withTheme } from "../../colors";
import type { Theme } from "../../colors";
import { useAuthSubmit } from "./auth.hooks";

type OwnProps = {
  privacy: Privacy;
  unlock: () => void;
  lock: () => void;
  biometricsError: Error | null | undefined;
};

type Props = OwnProps & {
  t: TFunction;
  colors: Theme["colors"];
};

const NormalHeader = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex alignItems="center" justifyContent="center">
      <Logos.LedgerLiveAltRegular color={colors.neutral.c100} width={50} height={50} />
      <LText semiBold secondary style={styles.title}>
        {t("auth.unlock.title")}
      </LText>
      <LText style={styles.description} color="grey">
        {t("auth.unlock.desc")}
      </LText>
    </Flex>
  );
};

type FormFooterProps = {
  inputFocused: boolean;
  onSubmit: () => void;
  passwordError: Error | null | undefined;
  passwordEmpty: boolean;
  onPress: () => void;
  colors: Theme["colors"];
};

const FormFooter = ({
  inputFocused,
  passwordEmpty,
  onSubmit,
  passwordError,
  onPress,
}: FormFooterProps) => {
  const { t } = useTranslation();

  return inputFocused ? (
    <BaseButton
      event="SubmitUnlock"
      title={t("auth.unlock.login")}
      type="primary"
      onPress={onSubmit}
      containerStyle={styles.buttonContainer}
      disabled={!!passwordError || passwordEmpty}
      isFocused
      useTouchable
    />
  ) : (
    <Touchable event="ForgetPassword" onPress={onPress}>
      <LText semiBold style={styles.link} color="live">
        {t("auth.unlock.forgotPassword")}
      </LText>
    </Touchable>
  );
};

const AuthScreen: React.FC<Props> = ({ t, privacy, biometricsError, lock, unlock, colors }) => {
  const [passwordError, setPasswordError] = useState<Error | null | undefined>(null);
  const [password, setPassword] = useState<string>("");
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [isModalOpened, setIsModalOpened] = useState<boolean>(false);
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);

  const { submit } = useAuthSubmit({
    password,
    unlock,
    setPasswordError,
    setPassword,
  });

  const toggleSecureTextEntry = useCallback(() => {
    setSecureTextEntry(prev => !prev);
  }, []);

  const onChangeInput = useCallback((password: string) => {
    setPassword(password);
    setPasswordError(null);
  }, []);

  const onFocusInput = useCallback(() => {
    setPasswordFocused(true);
  }, []);

  const onBlurInput = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  const onSubmitInput = useCallback(() => {
    submit();
  }, [submit]);

  const onCloseModal = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const onOpenModal = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  return (
    <SafeKeyboardView
      style={{
        backgroundColor: colors.background,
      }}
    >
      <KeyboardView style={styles.root} behavior="padding">
        <Flex flex={1} justifyContent="space-between">
          <Flex flex={1} px={16} justifyContent="center">
            <Flex alignItems="center" mt={32} mb={24}>
              {biometricsError ? (
                <FailBiometrics lock={lock} privacy={privacy} />
              ) : (
                <NormalHeader />
              )}
            </Flex>

            <PasswordInput
              error={passwordError}
              onChange={onChangeInput}
              onSubmit={onSubmitInput}
              toggleSecureTextEntry={toggleSecureTextEntry}
              secureTextEntry={secureTextEntry}
              placeholder={t("auth.unlock.inputPlaceholder")}
              onFocus={onFocusInput}
              onBlur={onBlurInput}
              password={password}
              testID="password-text-input"
            />

            {passwordError && (
              <LText style={styles.errorStyle}>
                <TranslatedError error={passwordError} />
              </LText>
            )}

            <FormFooter
              inputFocused={passwordFocused}
              onSubmit={onSubmitInput}
              passwordError={passwordError}
              passwordEmpty={!password}
              onPress={onOpenModal}
              colors={colors}
            />
          </Flex>

          {!passwordFocused && (
            <Flex pb={16} pointerEvents="none">
              <PoweredByLedger />
            </Flex>
          )}

          <QueuedDrawer isRequestingToBeOpened={isModalOpened} onClose={onCloseModal}>
            <HardResetModal />
          </QueuedDrawer>
        </Flex>
      </KeyboardView>
    </SafeKeyboardView>
  );
};

export default compose<React.ComponentType<OwnProps>>(
  withTranslation(),
  withReboot,
  withTheme,
)(AuthScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  logo: {
    alignSelf: "center",
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 16,
  },
  description: {
    textAlign: "center",
  },
  errorStyle: {
    color: "red",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  footer: {
    paddingBottom: 16,
  },
  link: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
    textAlign: "center",
  },
});
