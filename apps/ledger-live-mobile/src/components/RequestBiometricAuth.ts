import { useCallback, useEffect, useRef } from "react";
import FingerprintScanner from "react-native-fingerprint-scanner";
import { useTranslation } from "react-i18next";

type Props = {
  disabled: boolean;
  onSuccess: () => void;
  onError: (_: Error) => void;
};
export function useBiometricAuth({ disabled, onSuccess, onError }: Props) {
  const pending = useRef(false);
  const { t } = useTranslation();
  const auth = useCallback(async () => {
    if (pending.current) {
      return;
    }

    pending.current = true;

    try {
      await FingerprintScanner.authenticate({
        description: t("auth.unlock.biometricsTitle"),
        onAttempt: onError,
      });
      onSuccess();
    } catch (error) {
      onError(error);
    } finally {
      FingerprintScanner.release();
      pending.current = false;
    }
  }, [onError, onSuccess, t]);
  useEffect(() => {
    if (disabled) {
      return;
    }

    auth();
  }, [disabled, auth]);
} // deplicate once AuthPass component is refactored with hooks API

export default function RequestBiometricAuth(props: Props) {
  useBiometricAuth(props);
  return null;
}
