type SyncOnboardingNavigation = {
  getParent: () => { goBack: () => void } | undefined;
};

export function returnToPreviousScreen(
  navigation: SyncOnboardingNavigation,
  backReturnsToPrevious: boolean | undefined,
): boolean {
  if (!backReturnsToPrevious) return false;
  navigation.getParent()?.goBack();
  return true;
}
