/* @flow */
import React, { useCallback, useState } from "react";
import { Switch, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { setPrivacyBiometrics } from "../../../actions/settings";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import { useBiometricAuth } from "../../../components/RequestBiometricAuth";

type Props = {
  iconLeft: any,
};

export default function BiometricsRow({ iconLeft }: Props) {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const privacy = useSelector(privacySelector);

  const [validationPending, setValidationPending] = useState(false);

  const onValueChange = useCallback(
    async (biometricsEnabled: boolean) => {
      if (validationPending) return;
      if (biometricsEnabled) {
        setValidationPending(true);
      } else {
        dispatch(setPrivacyBiometrics(false));
      }
    },
    [dispatch, validationPending],
  );

  const onSuccess = useCallback(() => {
    setValidationPending(false);
    dispatch(setPrivacyBiometrics(true));
  }, [dispatch]);

  const onError = useCallback(
    error => {
      setValidationPending(false);
      Alert.alert(
        t("auth.failed.title"),
        `${t("auth.failed.denied")}\n${String(error || "")}`,
      );
    },
    [t],
  );

  useBiometricAuth({
    disabled: !validationPending,
    onSuccess,
    onError,
  });

  if (!privacy) return null;

  return (
    <>
      {privacy.biometricsType && (
        <>
          <SettingsRow
            event="BiometricsRow"
            iconLeft={iconLeft}
            centeredIcon
            title={
              <Trans
                i18nKey="auth.enableBiometrics.title"
                values={{
                  ...privacy,
                  biometricsType: privacy.biometricsType,
                }}
              />
            }
            desc={
              <Trans
                i18nKey="auth.enableBiometrics.desc"
                values={{
                  ...privacy,
                  biometricsType: privacy.biometricsType,
                }}
              />
            }
          >
            <Switch
              value={privacy.biometricsEnabled || validationPending}
              onValueChange={onValueChange}
            />
          </SettingsRow>
        </>
      )}
    </>
  );
}
