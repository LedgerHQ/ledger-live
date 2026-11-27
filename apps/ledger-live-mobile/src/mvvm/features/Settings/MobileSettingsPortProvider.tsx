import React, { type ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeepProtectionSheet } from "@features/flow-app-password-removal";
import { SettingsPortProvider } from "@features/flow-settings";
import { useAppLockScheme } from "LLM/features/AppLock/hooks/useAppLockScheme";
import { useLegacyAppLockAdapter } from "./sections/security/useLegacyAppLockAdapter";
import { useRevampedAppLockAdapter } from "./sections/security/useRevampedAppLockAdapter";
import type { ProtectionRefusals } from "./sections/security/types";
import { useMobileSettingsPort } from "./useMobileSettingsPort";

type ProviderProps = Readonly<{ children: ReactNode }>;

function ProtectionRefusalSheets({ refusals }: Readonly<{ refusals: ProtectionRefusals }>) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <>
      <KeepProtectionSheet
        isOpen={refusals.password.isOpen}
        protection="password"
        bottomInset={bottomInset}
        onClose={refusals.password.onClose}
      />
      <KeepProtectionSheet
        isOpen={refusals.biometrics.isOpen}
        protection="biometrics"
        biometricsKind={refusals.biometrics.kind}
        bottomInset={bottomInset}
        onClose={refusals.biometrics.onClose}
      />
    </>
  );
}

function RevampedSettingsPortProvider({ children }: ProviderProps) {
  const { appLock, refusals } = useRevampedAppLockAdapter();
  const port = useMobileSettingsPort(appLock);

  return (
    <SettingsPortProvider value={port}>
      {children}
      <ProtectionRefusalSheets refusals={refusals} />
    </SettingsPortProvider>
  );
}

function LegacySettingsPortProvider({ children }: ProviderProps) {
  const port = useMobileSettingsPort(useLegacyAppLockAdapter());

  return <SettingsPortProvider value={port}>{children}</SettingsPortProvider>;
}

/**
 * Gives the Settings sections their port. The App lock comes in two versions that the legacy
 * rows kept apart, so each has its own provider and the one `useAppLockScheme` resolves is mounted.
 */
export function MobileSettingsPortProvider({ children }: ProviderProps) {
  const scheme = useAppLockScheme();

  if (scheme === undefined) return null;

  return scheme === "revamped" ? (
    <RevampedSettingsPortProvider>{children}</RevampedSettingsPortProvider>
  ) : (
    <LegacySettingsPortProvider>{children}</LegacySettingsPortProvider>
  );
}
