import {
  resolveAppLockScheme,
  selectBiometricsEnabled,
  selectHasPassword,
  selectIsHydrated,
  type AppLockScheme,
} from "@features/platform-app-lock";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";

// The flag needs no readiness check here: the gate mounts inside `WaitForAppReady`, which holds
// the tree until `remoteFlagsReady`. Moving the provider above it would reintroduce that race.
export function useAppLockScheme(): AppLockScheme | undefined {
  const isRevampEnabled = useFeature("lwmPasswordRevamp")?.enabled ?? false;
  const isHydrated = useSelector(selectIsHydrated);
  const hasPassword = useSelector(selectHasPassword);
  const biometricsEnabled = useSelector(selectBiometricsEnabled);

  // Biometrics counts as stored protection too, or a user with it alone falls back to a path that
  // neither locks the app nor can turn their protection off.
  return isHydrated
    ? resolveAppLockScheme({
        hasStoredProtection: hasPassword || biometricsEnabled,
        isRevampEnabled,
      })
    : undefined;
}
