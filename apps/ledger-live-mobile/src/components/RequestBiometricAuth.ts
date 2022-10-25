import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import ReactNativeBiometrics from "react-native-biometrics";

const rnBiometrics = new ReactNativeBiometrics();

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

    rnBiometrics
      .simplePrompt({ promptMessage: t("auth.unlock.biometricsTitle") })
      .then(resultObject => {
        const { success } = resultObject;

        if (success) {
          onSuccess();
        }
        pending.current = false;
      })
      .catch(e => {
        onError(e);
      });
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
