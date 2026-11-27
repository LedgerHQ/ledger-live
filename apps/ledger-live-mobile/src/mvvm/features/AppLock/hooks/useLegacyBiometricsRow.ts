import { track } from "@shared/analytics";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { setPrivacyBiometrics } from "~/actions/settings";
import { useBiometricAuth } from "~/components/RequestBiometricAuth";
import { ScreenName } from "~/const";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { isLockedSelector } from "~/reducers/auth";
import { privacySelector } from "~/reducers/settings";

/**
 * The biometrics switch of the legacy App lock: it shows the choice at once, asks the device to
 * confirm it, and only then stores it. Shared by the legacy Settings row and the new Security
 * section, so both behave the same.
 */
export function useLegacyBiometricsRow() {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const privacy = useSelector(privacySelector);
  const isLocked = useSelector(isLockedSelector);

  const [validationPending, setValidationPending] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(
    privacy?.biometricsEnabled || validationPending,
  );

  const onValueChange = useCallback(
    (biometricsEnabled: boolean) => {
      track("toggle_clicked", {
        toggle: "biometrics",
        page: ScreenName.GeneralSettings,
        enabled: !!privacy?.biometricsEnabled,
      });

      if (validationPending) return;
      setValidationPending(true);
      setBiometricsEnabled(biometricsEnabled);
    },
    [privacy?.biometricsEnabled, validationPending],
  );

  const onSuccess = useCallback(() => {
    setValidationPending(false);
    dispatch(setPrivacyBiometrics(biometricsEnabled));
  }, [dispatch, biometricsEnabled]);

  const onError = useCallback(
    (error?: Error) => {
      setValidationPending(false);
      setBiometricsEnabled((val: boolean) => !val);
      Alert.alert(t("auth.failed.title"), `${t("auth.failed.denied")}\n${String(error || "")}`);
    },
    [t],
  );

  const onCancel = useCallback(() => {
    setValidationPending(false);
    setBiometricsEnabled((val: boolean) => !val);
  }, []);

  useBiometricAuth({
    disabled: !validationPending || isLocked,
    onSuccess,
    onError,
    onCancel,
  });

  // Reset the switch state if user directly disable password
  useEffect(() => {
    if (!privacy?.hasPassword && biometricsEnabled) {
      setBiometricsEnabled(false);
    }
  }, [privacy, biometricsEnabled]);

  return { privacy, biometricsEnabled, onValueChange };
}
