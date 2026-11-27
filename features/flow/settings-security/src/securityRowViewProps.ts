import type { SecurityLabels } from "./copy/useSecuritySettingsLabels";
import { getAppLockAction } from "./logic/appLock";
import { parseAutoLockTimeout } from "./logic/autoLock";
import type { SecurityRow } from "./logic/securityRows";
import type { SecuritySettingsPort } from "./ports";
import type { SecurityRowViewProps } from "./Security.types";
import { trackHideBalanceToggle, trackMevProtectionToggle } from "./tracking";

type RowContext = Readonly<{
  port: SecuritySettingsPort;
  labels: SecurityLabels;
  openMevProtectionInfo: () => void;
  base: Pick<SecurityRowViewProps, "id" | "disabled" | "testID">;
}>;

type RowBuilder = (context: RowContext) => SecurityRowViewProps;

const ROW_BUILDERS: Readonly<Record<SecurityRow["id"], RowBuilder>> = {
  hideBalance: ({ port: { values, setValue }, labels, base }) => ({
    ...base,
    ...labels.hideBalance,
    trailing: {
      type: "toggle",
      value: values.hideBalance,
      onToggle: value => {
        trackHideBalanceToggle(value);
        setValue({ key: "hideBalance", value });
      },
    },
  }),

  appLock: ({ port: { values, requestAppLock }, labels, base }) => ({
    ...base,
    ...labels.appLock,
    trailing: {
      type: "toggle",
      value: values.passwordSet,
      onToggle: () => {
        const action = getAppLockAction(values.passwordSet, "toggle");
        if (action) requestAppLock(action);
      },
    },
  }),

  changePassword: ({ port: { values, requestAppLock }, labels, base }) => ({
    ...base,
    title: labels.changePassword.title,
    description: labels.changePassword.description,
    trailing: {
      type: "button",
      label: labels.changePassword.action,
      onSelect: () => {
        const action = getAppLockAction(values.passwordSet, "change");
        if (action) requestAppLock(action);
      },
    },
  }),

  autoLock: ({ port: { values, setValue }, labels, base }) => ({
    ...base,
    title: labels.autoLock.title,
    description: labels.autoLock.description,
    trailing: {
      type: "select",
      value: String(values.autoLockTimeout),
      options: labels.autoLock.options,
      onSelectOption: option => {
        const value = parseAutoLockTimeout(option);
        if (value !== null) setValue({ key: "autoLockTimeout", value });
      },
    },
  }),

  biometrics: ({ port: { values, setValue }, labels, base }) => ({
    ...base,
    title: labels.biometrics.title,
    description: base.disabled
      ? labels.biometrics.disabledDescription
      : labels.biometrics.description,
    biometricKind: values.biometricKind ?? undefined,
    trailing: {
      type: "toggle",
      value: values.biometricsEnabled,
      onToggle: value => setValue({ key: "biometricsEnabled", value }),
    },
  }),

  mevProtection: ({ port: { values, setValue }, labels, openMevProtectionInfo, base }) => ({
    ...base,
    title: labels.mevProtection.title,
    description: labels.mevProtection.description,
    descriptionLink: { label: labels.mevProtection.learnMore, onSelect: openMevProtectionInfo },
    trailing: {
      type: "toggle",
      value: values.mevProtection,
      onToggle: value => {
        trackMevProtectionToggle(value);
        setValue({ key: "mevProtection", value });
      },
    },
  }),
};

/** What the View shows for one row: wording, current value and what a press does. */
export function toSecurityRowViewProps(
  { id, enabled }: SecurityRow,
  port: SecuritySettingsPort,
  labels: SecurityLabels,
  openMevProtectionInfo: () => void,
): SecurityRowViewProps {
  const base = { id, disabled: !enabled, testID: `setting-${id}` };
  return ROW_BUILDERS[id]({ port, labels, openMevProtectionInfo, base });
}
