import React, { memo, useCallback, useEffect, useState } from "react";
import { Platform, Vibration } from "react-native";
import * as Keychain from "react-native-keychain";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { PasswordsDontMatchError } from "@ledgerhq/errors";

import { CompositeScreenProps } from "@react-navigation/native";
import { setPrivacy } from "~/actions/settings";
import PasswordForm from "./PasswordForm";
import { VIBRATION_PATTERN_ERROR } from "~/utils/constants";
import { ScreenName } from "~/const";
import type { PasswordAddFlowParamList } from "~/components/RootNavigator/types/PasswordAddFlowNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";

type Props = CompositeScreenProps<
  StackNavigatorProps<PasswordAddFlowParamList, ScreenName.ConfirmPassword>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

const ConfirmPassword = ({ route, navigation }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const [biometricsType, setPBiometricType] = useState<Keychain.BIOMETRY_TYPE | null>(null);

  const save = useCallback(async () => {
    if (!route.params?.password) return;
    const options =
      Platform.OS === "ios"
        ? {}
        : {
            accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD,
            rules: Keychain.SECURITY_RULES.NONE,
          };
    try {
      await Keychain.setGenericPassword("ledger", route.params?.password, options);
      dispatch(
        setPrivacy({
          hasPassword: true,
          biometricsType,
          biometricsEnabled: false,
        }),
      );
      const n = navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
      if (n) n.goBack();
    } catch (err) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.log("could not save credentials");
    }
  }, [biometricsType, dispatch, navigation, route.params?.password]);

  const onChange = useCallback((confirmPassword: string) => {
    setConfirmPassword(confirmPassword);
    setError(null);
  }, []);

  const onSubmit = useCallback(() => {
    if (!route.params?.password) return;
    if (route.params?.password === confirmPassword) {
      save();
    } else {
      Vibration.vibrate(VIBRATION_PATTERN_ERROR);
      setError(new PasswordsDontMatchError());
      setConfirmPassword("");
    }
  }, [route.params?.password, save, confirmPassword]);

  useEffect(() => {
    Keychain.getSupportedBiometryType().then(biometricsType => {
      if (biometricsType) setPBiometricType(biometricsType);
    });
  }, []);

  return (
    <PasswordForm
      placeholder={t("auth.confirmPassword.placeholder")}
      onChange={onChange}
      onSubmit={onSubmit}
      error={error}
      value={confirmPassword}
    />
  );
};

export default memo(ConfirmPassword);
