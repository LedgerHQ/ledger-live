import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GestureResponderEvent, Linking } from "react-native";
import { useDispatch } from "react-redux";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import BaseInput from "@ledgerhq/native-ui/components/Form/Input/BaseInput/index";
import { login } from "@ledgerhq/live-common/platform/providers/ProtectProvider/api/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import TabBarSafeAreaView from "../../components/TabBar/TabBarSafeAreaView";
import Button from "../../components/wrappedUi/Button";
import { StackNavigatorNavigation } from "../../components/RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "../../components/RootNavigator/types/ManagerNavigator";
import { ScreenName } from "../../const";
import {
  resetProtectState,
  updateProtectData,
  updateProtectStatus,
} from "../../actions/protect";
import { formatData, getProtectStatus } from "../../logic/protect";
import { deleteProtect } from "../../db";
import { ServicesConfig } from "../../components/ServicesWidget/types";
import { urls } from "../../config/urls";

function Login() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );
  const navigation =
    useNavigation<StackNavigatorNavigation<ManagerNavigatorStackParamList>>();

  const servicesConfig: ServicesConfig | null = useFeature(
    "protectServicesMobile",
  );

  const { params } = servicesConfig || {};
  const { forgotPasswordURI } = params?.login || {};

  const validateEmail = useCallback(() => {
    if (!email) {
      setEmailError(t("protect.login.errors.emptyEmail"));
      return false;
    }

    setEmailError("");
    return true;
  }, [email, t]);

  const validatePassword = useCallback(() => {
    if (!password) {
      setPasswordError(t("protect.login.errors.emptyPassword"));
      return false;
    }

    setPasswordError("");
    return true;
  }, [password, t]);

  const onEmailChange = useCallback((value: string) => {
    setEmail(value);
    setEmailError("");
  }, []);

  const onPasswordChange = useCallback((value: string) => {
    setPassword(value);
    setPasswordError("");
  }, []);

  const onSubmit = useCallback(
    async (e: GestureResponderEvent) => {
      e.preventDefault();

      const valideEmail = validateEmail();
      const validePassword = validatePassword();

      if (!valideEmail || !validePassword) return;

      const res = await login(email, password);

      if (!res) return;

      const data = formatData(res);

      dispatch(updateProtectData(data));
      dispatch(updateProtectStatus(getProtectStatus(data)));

      navigation.navigate(ScreenName.Manager);
    },
    [dispatch, email, navigation, password, validateEmail, validatePassword],
  );

  const onForgotPassword = useCallback(() => {
    const url = `${forgotPasswordURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }, [forgotPasswordURI]);

  useEffect(() => {
    dispatch(resetProtectState());
    deleteProtect();
  }, [dispatch]);

  return (
    <TabBarSafeAreaView
      style={{
        backgroundColor: colors.background.main,
      }}
    >
      <Flex px={6} pt={6}>
        <Text mb={9} variant="h4">
          {t("protect.login.title")}
        </Text>
        <Text mb={10} variant="body">
          {t("protect.login.desc")}
        </Text>

        <Box>
          <BaseInput
            value={email}
            error={emailError}
            onChangeText={onEmailChange}
            onBlur={validateEmail}
            placeholder={t("protect.login.email")}
            textContentType="emailAddress"
            autoCapitalize="none"
          />
        </Box>
        <Box mt={8}>
          <BaseInput
            value={password}
            error={passwordError}
            onChangeText={onPasswordChange}
            onBlur={validatePassword}
            placeholder={t("protect.login.password")}
            textContentType="password"
            autoCapitalize="none"
            secureTextEntry
          />
        </Box>
        <Text mt={6} variant="body" onPress={onForgotPassword}>
          {t("protect.login.forgotPassword")}
        </Text>
        <Button
          onPress={onSubmit}
          size={"large"}
          type={"main"}
          mt={10}
          disabled={!email || !password}
        >
          {t("protect.login.cta")}
        </Button>
      </Flex>
    </TabBarSafeAreaView>
  );
}

export default Login;
