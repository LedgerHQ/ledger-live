import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UnlockForReveal } from "@features/flow-pay-card-details";
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
  onSubmit: (password: string, confirmPassword: string) => void | Promise<void>;
  onCancel: () => void;
}>;

type PasswordUnlockValidationError = "required" | "mismatch";

const VALIDATION_ERROR_KEYS: Record<PasswordUnlockValidationError, string> = {
  required: "payTab.card.numbers.passwordRequired",
  mismatch: "payTab.card.numbers.passwordMismatch",
};

function validateCardNumbersPassword(
  mode: CardNumbersUnlockMode,
  password: string,
  confirmPassword: string,
): PasswordUnlockValidationError | undefined {
  if (!password) {
    return "required";
  }
  if (mode === "create" && password !== confirmPassword) {
    return "mismatch";
  }
  return undefined;
}

type UnlockResolve = (ok: boolean) => void;

export function useUnlockForCardNumbers(): {
  unlock: UnlockForReveal;
  dialog: CardNumbersUnlockDialogState;
} {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasPassword = useSelector(hasPasswordSelector);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolveRef = useRef<UnlockResolve | null>(null);

  const mode: CardNumbersUnlockMode = hasPassword ? "verify" : "create";

  useEffect(() => {
    return () => {
      resolveRef.current?.(false);
      resolveRef.current = null;
    };
  }, []);

  const unlock = useCallback<UnlockForReveal>(
    () =>
      new Promise(resolve => {
        setError(undefined);
        setIsSubmitting(false);
        resolveRef.current = resolve;
        setIsOpen(true);
      }),
    [],
  );

  const finish = useCallback((ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setError(undefined);
    setIsOpen(false);
  }, []);

  const onCancel = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    finish(false);
  }, [finish, isSubmitting]);

  const onSubmit = useCallback(
    async (password: string, confirmPassword: string) => {
      if (isSubmitting) {
        return;
      }

      const validationError = validateCardNumbersPassword(mode, password, confirmPassword);
      if (validationError) {
        setError(t(VALIDATION_ERROR_KEYS[validationError]));
        return;
      }

      setIsSubmitting(true);
      try {
        if (mode === "create") {
          await setEncryptionKey(password);
          dispatch(setHasPassword(true));
          finish(true);
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
        setIsSubmitting(false);
      }
    },
    [dispatch, finish, isSubmitting, mode, t],
  );

  return {
    unlock,
    dialog: {
      isOpen,
      mode,
      error,
      isSubmitting,
      onSubmit,
      onCancel,
    },
  };
}
