import type { AppLockState } from "./state/types";

type AppLockProtection = Pick<AppLockState, "hasPassword" | "biometricsEnabled">;

export type UnlockPath =
  | Readonly<{ kind: "open" }>
  | Readonly<{ kind: "biometrics"; hasPasswordFallback: boolean }>
  | Readonly<{ kind: "password" }>;

export function resolveUnlockPath(protection: AppLockProtection): UnlockPath {
  if (protection.biometricsEnabled) {
    return { kind: "biometrics", hasPasswordFallback: protection.hasPassword };
  }

  if (protection.hasPassword) {
    return { kind: "password" };
  }

  return { kind: "open" };
}
