import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UnlockForCardNumbers } from "@features/flow-pay-card-details";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setHasPassword } from "~/renderer/actions/application";
import { isEncryptionKeyCorrect, setEncryptionKey } from "~/renderer/storage";
import { hasPasswordSelector } from "~/renderer/reducers/application";

export type CardNumbersUnlockMode = "create" | "verify";

export type CardNumbersUnlockDialogState = Readonly<{
  isOpen: boolean;
  mode: CardNumbersUnlockMode;
  error?: string;
  isSubmitting: boolean;
  isBusy: boolean;
  onSubmit: (password: string, confirmPassword: string) => void | Promise<void>;
  onCancel: () => void;
}>;

type UnlockResolve = ((ok: boolean) => void) | null;

const SHOW_LOADING_AFTER_MS = 500;

export function useUnlockForCardNumbers(): {
  unlock: UnlockForCardNumbers;
  dialog: CardNumbersUnlockDialogState;
} {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasPassword = useSelector(hasPasswordSelector);
  const [resolveUnlock, setResolveUnlock] = useState<UnlockResolve>(null);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const inFlightRef = useRef(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resolveUnlockRef = useRef<UnlockResolve>(null);

  const mode: CardNumbersUnlockMode = hasPassword ? "verify" : "create";

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== undefined) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = undefined;
      }
      resolveUnlockRef.current?.(false);
      resolveUnlockRef.current = null;
    };
  }, []);

  const stopSubmitting = useCallback(() => {
    if (loadingTimerRef.current !== undefined) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = undefined;
    }
    inFlightRef.current = false;
    setIsBusy(false);
    setIsSubmitting(false);
  }, []);

  const unlock = useCallback<UnlockForCardNumbers>(
    () =>
      new Promise(resolve => {
        stopSubmitting();
        setError(undefined);
        resolveUnlockRef.current = resolve;
        setResolveUnlock(() => resolve);
      }),
    [stopSubmitting],
  );

  const finish = useCallback(
    (ok: boolean) => {
      resolveUnlockRef.current = null;
      setResolveUnlock((current: UnlockResolve) => {
        current?.(ok);
        return null;
      });
      setError(undefined);
      stopSubmitting();
    },
    [stopSubmitting],
  );

  const onCancel = useCallback(() => {
    if (inFlightRef.current) {
      return;
    }
    finish(false);
  }, [finish]);

  const onSubmit = useCallback(
    async (password: string, confirmPassword: string) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setIsBusy(true);
      loadingTimerRef.current = setTimeout(() => {
        setIsSubmitting(true);
      }, SHOW_LOADING_AFTER_MS);

      try {
        if (!password) {
          setError(t("payTab.card.numbers.passwordRequired"));
          return;
        }

        if (mode === "create") {
          if (password !== confirmPassword) {
            setError(t("payTab.card.numbers.passwordMismatch"));
            return;
          }
          await setEncryptionKey(password);
          finish(true);
          dispatch(setHasPassword(true));
          return;
        }

        if (!(await isEncryptionKeyCorrect(password))) {
          setError(t("payTab.card.numbers.passwordIncorrect"));
          return;
        }
        finish(true);
      } catch {
        setError(
          t(
            mode === "create"
              ? "payTab.card.numbers.passwordCreateFailed"
              : "payTab.card.numbers.passwordUnavailable",
          ),
        );
      } finally {
        stopSubmitting();
      }
    },
    [dispatch, finish, mode, stopSubmitting, t],
  );

  return {
    unlock,
    dialog: {
      isOpen: resolveUnlock !== null,
      mode,
      error,
      isSubmitting,
      isBusy,
      onSubmit,
      onCancel,
    },
  };
}
