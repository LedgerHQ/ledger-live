import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import { setPrivacyBiometrics } from "../../../actions/settings";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import { useBiometricAuth } from "../../../components/RequestBiometricAuth";

type Props = {
  iconLeft?: React.ReactNode;
};

export default function BiometricsRow({ iconLeft }: Props) {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const privacy = useSelector(privacySelector);

  const [validationPending, setValidationPending] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(
    privacy?.biometricsEnabled || validationPending,
  );

  const biometricsType =
    t(`auth.enableBiometrics.${privacy?.biometricsType?.toLowerCase()}`) ?? privacy?.biometricsType;

  const onValueChange = useCallback(
    async (biometricsEnabled: boolean) => {
      if (validationPending) return;
      setValidationPending(true);
      setBiometricsEnabled(biometricsEnabled);
    },
    [validationPending],
  );

  const onSuccess = useCallback(() => {
    setValidationPending(false);
    dispatch(setPrivacyBiometrics(biometricsEnabled));
  }, [dispatch, biometricsEnabled]);

  const onError = useCallback(
    error => {
      setValidationPending(false);
      setBiometricsEnabled((val: boolean) => !val);
      Alert.alert(t("auth.failed.title"), `${t("auth.failed.denied")}\n${String(error || "")}`);
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
            title={t("auth.enableBiometrics.title", { biometricsType })}
            desc={t("auth.enableBiometrics.desc", { biometricsType })}
          >
            <Switch checked={biometricsEnabled} onChange={onValueChange} />
          </SettingsRow>
        </>
      )}
    </>
  );
}
