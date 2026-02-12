import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useMemo } from "react";

interface ContentSectionViewModelParams {
  readonly status: {
    readonly onboarding: OnboardStatus;
    readonly authorize: AuthorizeStatus;
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
  const { onboarding, authorize, hasResult } = status;

  const isAuthorizationPhase = useMemo(
    () => hasResult && onboarding !== OnboardStatus.ERROR,
    [hasResult, onboarding],
  );

  const displayStatus = useMemo(
    () => (isAuthorizationPhase ? authorize : onboarding),
    [isAuthorizationPhase, authorize, onboarding],
  );

  const showError = useMemo(
    () =>
      Boolean(error && (onboarding === OnboardStatus.ERROR || authorize === AuthorizeStatus.ERROR)),
    [error, onboarding, authorize],
  );

  const successKey = useMemo(
    () => (isReonboarding ? "canton.onboard.reonboard.success" : "canton.onboard.success"),
    [isReonboarding],
  );

  const statusTranslationKey = useMemo(
    () => getStatusTranslationKey(displayStatus, isAuthorizationPhase),
    [displayStatus, isAuthorizationPhase],
  );

  return {
    isAuthorizationPhase,
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

const AUTHORIZE_TRANSLATION_KEYS: Partial<Record<AuthorizeStatus, string>> = {
  [AuthorizeStatus.PREPARE]: "canton.authorize.status.prepare",
  [AuthorizeStatus.SUBMIT]: "canton.authorize.status.submit",
};

export function getStatusTranslationKey(
  status: OnboardStatus | AuthorizeStatus,
  isAuthorization: boolean,
): string {
  const keys = isAuthorization ? AUTHORIZE_TRANSLATION_KEYS : ONBOARD_TRANSLATION_KEYS;
  return (
    keys[status] ||
    (isAuthorization ? "canton.authorize.status.default" : "canton.onboard.status.default")
  );
}
