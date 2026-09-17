import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UnlockForReveal } from "@features/flow-pay-card-details";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setHasPassword } from "~/renderer/actions/application";
import { isEncryptionKeyCorrect, setEncryptionKey } from "~/renderer/storage";
import { hasPasswordSelector } from "~/renderer/reducers/application";

export type CardNumbersUnlockMode = "create" | "verify";
export type CardNumbersUnlockPhase = "closed" | "open" | "submitting";
export type CardNumbersUnlockOutcome = "allowReveal" | "cancelReveal";
type CardNumbersPasswordCheck = "correct" | "incorrect";

export type CardNumbersUnlockDialogState = Readonly<{
  phase: CardNumbersUnlockPhase;
  mode: CardNumbersUnlockMode;
  error?: string;
  onSubmit: (password: string, confirmPassword: string) => void | Promise<void>;
  onCancel: () => void;
}>;

const ignoreOutcome = (_outcome: CardNumbersUnlockOutcome) => {};

export const useUnlockForCardNumbers = (): {
  unlock: UnlockForReveal;
  dialog: CardNumbersUnlockDialogState;
} => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasPassword = useSelector(hasPasswordSelector);
  const [phase, setPhase] = useState<CardNumbersUnlockPhase>("closed");
  const [error, setError] = useState<string>();
  // Next complete() lands here. Idle = ignoreOutcome (nobody waiting).
  const settle = useRef(ignoreOutcome);

  const mode: CardNumbersUnlockMode = hasPassword ? "verify" : "create";

  const complete = (outcome: CardNumbersUnlockOutcome) => {
    settle.current(outcome);
    settle.current = ignoreOutcome;
    setError(undefined);
    setPhase("closed");
  };

  useEffect(
    () => () => {
      // Card left the tree. Fail the open unlock() so reveal does not hang.
      settle.current("cancelReveal");
      settle.current = ignoreOutcome;
    },
    [],
  );

  const unlock: UnlockForReveal = () =>
    new Promise(done => {
      // Second View while a dialog is already up: fail the first Promise.
      settle.current("cancelReveal");
      // Next complete() resolves this Promise. allowReveal → true for the shared VM.
      settle.current = outcome => done(outcome === "allowReveal");
      setError(undefined);
      setPhase("open");
    });

  const onCancel = () => {
    if (phase === "submitting") return;
    complete("cancelReveal");
  };

  const onSubmit = async (password: string, confirmPassword: string) => {
    if (phase === "submitting") return;

    if (!password) {
      setError(t("payTab.card.numbers.passwordRequired"));
      return;
    }

    if (mode === "create" && password !== confirmPassword) {
      setError(t("payTab.card.numbers.passwordMismatch"));
      return;
    }

    setPhase("submitting");
    try {
      if (mode === "verify") {
        const passwordCheck: CardNumbersPasswordCheck = (await isEncryptionKeyCorrect(password))
          ? "correct"
          : "incorrect";
        if (passwordCheck === "incorrect") {
          setError(t("payTab.card.numbers.passwordIncorrect"));
          return;
        }
      } else {
        await setEncryptionKey(password);
        dispatch(setHasPassword(true));
      }
      complete("allowReveal");
    } catch {
      if (mode === "verify") {
        setError(t("payTab.card.numbers.passwordUnavailable"));
      }
      if (mode === "create") {
        setError(t("payTab.card.numbers.passwordCreateFailed"));
      }
    } finally {
      setPhase(current => (current === "submitting" ? "open" : current));
    }
  };

  return {
    unlock,
    dialog: { phase, mode, error, onSubmit, onCancel },
  };
};
