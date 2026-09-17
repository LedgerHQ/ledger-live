import {
  resolveAppLockScheme,
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
  const hasStoredVerifier = useSelector(selectHasPassword);

  return isHydrated ? resolveAppLockScheme({ hasStoredVerifier, isRevampEnabled }) : undefined;
}
