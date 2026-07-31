type Listener = () => void;

let isDismissed = false;
const listeners = new Set<Listener>();

function setDismissed(nextValue: boolean) {
  if (isDismissed === nextValue) return;

  isDismissed = nextValue;
  for (const listener of listeners) listener();
}

export function getLazyOnboardingBannerDismissed(): boolean {
  return isDismissed;
}

export function subscribeToLazyOnboardingBannerSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dismissLazyOnboardingBannerForSession(): void {
  setDismissed(true);
}

export function resetLazyOnboardingBannerSession(): void {
  setDismissed(false);
}
