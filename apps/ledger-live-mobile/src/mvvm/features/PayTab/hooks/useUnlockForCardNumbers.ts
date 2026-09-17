import { useEffect, useRef, useState } from "react";
import { selectHasPassword } from "@features/platform-app-lock";
import type { UnlockForReveal } from "@features/flow-pay-card";
import { useTranslation } from "~/context/Locale";
import { matchesPasswordVerifier } from "@shared/password-verifier";
import { useSelector } from "~/context/hooks";
import {
  derivePasswordDigest,
  serialiseDerivation,
} from "LLM/features/AppLock/adapters/passwordDigest";
import { readPasswordVerifier } from "LLM/features/AppLock/adapters/verifierStore";
import { usePasswordSetup } from "LLM/features/AppLock/hooks/usePasswordSetup";

export type CardNumbersUnlockMode = "create" | "verify";
export type CardNumbersUnlockPhase = "closed" | "open" | "submitting";
export type CardNumbersUnlockOutcome = "allowReveal" | "cancelReveal";

export type CardNumbersUnlockDialogState = Readonly<{
  phase: CardNumbersUnlockPhase;
  mode: CardNumbersUnlockMode;
  error?: string;
  onSubmit: (password: string, confirmPassword: string) => void | Promise<void>;
  onCancel: () => void;
}>;

const ignoreOutcome = (_outcome: CardNumbersUnlockOutcome) => {};

export function useUnlockForCardNumbers(): {
  unlock: UnlockForReveal;
  dialog: CardNumbersUnlockDialogState;
} {
  const { t } = useTranslation();
  const hasPassword = useSelector(selectHasPassword);
  const { savePassword } = usePasswordSetup();
  const [phase, setPhase] = useState<CardNumbersUnlockPhase>("closed");
  const [error, setError] = useState<string>();
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
      settle.current("cancelReveal");
      settle.current = ignoreOutcome;
    },
    [],
  );

  const unlock: UnlockForReveal = () =>
    new Promise(done => {
      settle.current("cancelReveal");
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
        const ok = await serialiseDerivation(async () => {
          const verifier = await readPasswordVerifier();
          if (!verifier) return false;
          const digest = await derivePasswordDigest(password, verifier.salt, verifier.scrypt);
          return matchesPasswordVerifier(verifier, digest);
        });
        if (!ok) {
          setError(t("payTab.card.numbers.passwordIncorrect"));
          return;
        }
      } else {
        await savePassword(password);
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
}
