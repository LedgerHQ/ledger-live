import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useMemo } from "react";

interface ContentSectionViewModelParams {
  readonly status: {
    readonly onboarding: OnboardStatus;
    readonly hasResult: boolean;
  };
  readonly isReonboarding: boolean;
  readonly error: Error | null;
}

export function useContentSectionViewModel({
  status,
  isReonboarding,
  error,
}: ContentSectionViewModelParams) {
  const { onboarding } = status;

  const displayStatus = onboarding;

  const showError = useMemo(
    () => Boolean(error && onboarding === OnboardStatus.ERROR),
    [error, onboarding],
  );

  const successKey = useMemo(
    () => (isReonboarding ? "canton.onboard.reonboard.success" : "canton.onboard.success"),
    [isReonboarding],
  );

  const statusTranslationKey = useMemo(
    () => getStatusTranslationKey(displayStatus),
    [displayStatus],
  );

  return {
    displayStatus,
    showError,
    successKey,
    statusTranslationKey,
  };
}

const ONBOARD_TRANSLATION_KEYS: Partial<Record<OnboardStatus, string>> = {
  [OnboardStatus.PREPARE]: "canton.onboard.status.prepare",
  [OnboardStatus.SUBMIT]: "canton.onboard.status.submit",
};

export function getStatusTranslationKey(status: OnboardStatus): string {
  return ONBOARD_TRANSLATION_KEYS[status] || "canton.onboard.status.default";
}
