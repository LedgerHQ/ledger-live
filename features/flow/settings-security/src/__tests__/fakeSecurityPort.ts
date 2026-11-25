import { createFakePort } from "@features/flow-settings/testing";
import type { SecuritySettingsPort } from "../ports";
import type { SecuritySettingsValues, SecurityUpdate } from "../types";

const DEFAULT_SECURITY_VALUES: SecuritySettingsValues = {
  hideBalance: false,
  mevProtection: false,
  passwordSet: false,
  autoLockTimeout: 10,
  biometricKind: null,
  biometricsEnabled: false,
  biometricsRequirePassword: false,
};

/** A port for tests: values change with each update, and the app-only action is recorded. */
export function createFakeSecurityPort(initial?: Partial<SecuritySettingsValues>) {
  const { port, updates } = createFakePort<SecuritySettingsValues, SecurityUpdate>(
    DEFAULT_SECURITY_VALUES,
    initial,
  );
  const requestAppLock = jest.fn();

  const securityPort: SecuritySettingsPort = {
    get values() {
      return port.values;
    },
    setValue: port.setValue,
    requestAppLock,
  };

  return { port: securityPort, updates, requestAppLock };
}
