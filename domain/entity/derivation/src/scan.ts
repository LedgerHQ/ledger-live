import { networkFromCurrencyId } from "@domain/entity-account-descriptor";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  CREATABLE_MODES_BY_FAMILY,
  DERIVATION_MODES,
  LEGACY_MODES,
  MANDATORY_EMPTY_ACCOUNT_SKIP_BY_CURRENCY,
  WITH_TAPROOT,
  WITHOUT_BIP44,
  type DerivationModeSpec,
} from "./modes.internals";
import { AccountCandidateSchema, type AccountCandidate, type DerivationMode } from "./schema";
import {
  accountPathOf,
  addressPathOf,
  standardScheme,
  type DerivationScheme,
} from "./scheme.internals";

/** The most account indexes a mode is scanned over, as in the legacy scan. */
export const MAX_ACCOUNT_INDEX = 255;

export type ScanRules = {
  /** `KEYCHAIN_OBSERVABLE_RANGE`: a floor for every mode's gap limit. */
  readonly keychainObservableRange?: number;
  /** `SHOW_LEGACY_NEW_ACCOUNT`: offer a new account in the legacy "" mode. */
  readonly showLegacyNewAccount?: boolean;
  /** `SCAN_FOR_INVALID_PATHS`: also scan the modes marked `isInvalid`. */
  readonly scanForInvalidPaths?: boolean;
};

export type ModeScan = {
  readonly startsAt: number;
  /** Exclusive upper bound of the account index. */
  readonly stopAt: number;
  readonly mandatoryEmptyAccountSkip: number;
  readonly supportsIndex: (index: number) => boolean;
};

const isInvalid = (spec: DerivationModeSpec) => spec.isInvalid === true;

/** The modes a currency is scanned with, in scan order. By convention the last is the standard one. */
export function derivationModesOf(
  currency: CryptoCurrency,
  rules: ScanRules = {},
): DerivationMode[] {
  const modes: DerivationMode[] = [...(LEGACY_MODES.get(currency.id) ?? [])];
  if (currency.forkedFrom) {
    modes.push("unsplit");
    if (currency.supportsSegwit) modes.push("segwit_unsplit");
  }
  if (currency.supportsNativeSegwit) modes.push("native_segwit");
  if (WITH_TAPROOT.has(currency.id)) modes.push("taproot");
  if (currency.supportsSegwit) modes.push("segwit");
  if (!WITHOUT_BIP44.has(currency.id)) modes.push("");
  if (rules.scanForInvalidPaths) return modes;
  return modes.filter(mode => !isInvalid(DERIVATION_MODES[mode]));
}

export function scanOf(
  currency: CryptoCurrency,
  mode: DerivationMode,
  rules: ScanRules = {},
): ModeScan {
  const spec: DerivationModeSpec = DERIVATION_MODES[mode];
  return {
    startsAt: spec.startsAt ?? 0,
    stopAt: spec.isNonIterable ? 1 : MAX_ACCOUNT_INDEX,
    mandatoryEmptyAccountSkip: Math.max(
      spec.mandatoryEmptyAccountSkip ?? 0,
      MANDATORY_EMPTY_ACCOUNT_SKIP_BY_CURRENCY.get(currency.id) ?? 0,
      rules.keychainObservableRange ?? 0,
    ),
    supportsIndex: index => !(spec.skipFirst && index === 0),
  };
}

/** Whether the first empty account of the mode is offered as one the user can create. */
export function offersNewAccount(
  currency: CryptoCurrency,
  mode: DerivationMode,
  rules: ScanRules = {},
): boolean {
  const modes = derivationModesOf(currency, rules);
  if (modes.at(-1) === mode || mode === "segwit") return true;
  if (mode === "" && rules.showLegacyNewAccount) return true;
  return CREATABLE_MODES_BY_FAMILY.get(currency.family)?.includes(mode) ?? false;
}

/** The scheme of a mode, as `getDerivationScheme`. */
function derivationSchemeOf(currency: CryptoCurrency, mode: DerivationMode): DerivationScheme {
  const spec: DerivationModeSpec = DERIVATION_MODES[mode];
  return (
    spec.overridesDerivation ??
    standardScheme(spec.purpose ?? 44, spec.isUnsplit ? currency.forkedFrom : undefined)
  );
}

export function candidateOf(
  currency: CryptoCurrency,
  mode: DerivationMode,
  index: number,
): AccountCandidate {
  const scheme = derivationSchemeOf(currency, mode);
  return AccountCandidateSchema.parse({
    network: networkFromCurrencyId(currency.id),
    derivationMode: mode,
    index,
    accountPath: accountPathOf(scheme, currency.coinType, index),
    addressPath: addressPathOf(scheme, currency.coinType, index),
  });
}
