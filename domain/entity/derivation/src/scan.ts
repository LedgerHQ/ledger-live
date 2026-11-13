import { canonicalPath, networkFromCurrencyId } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  CREATABLE_MODES_BY_FAMILY,
  DERIVATION_MODES,
  LEGACY_MODES,
  MANDATORY_EMPTY_ACCOUNT_SKIP_BY_CURRENCY,
  WITH_TAPROOT,
  WITHOUT_BIP44,
  type DerivationMode,
  type DerivationModeSpec,
} from "./modes";
import { AccountCandidateSchema, type AccountCandidate } from "./schema";

/** The most account indexes a mode is scanned over, as in the legacy scan. */
export const MAX_ACCOUNT_INDEX = 255;

export type ScanRules = {
  /** `KEYCHAIN_OBSERVABLE_RANGE`: a floor for every mode's gap limit. */
  readonly keychainObservableRange?: number;
  /** `SHOW_LEGACY_NEW_ACCOUNT`: offer a new account in the legacy "" mode. */
  readonly showLegacyNewAccount?: boolean;
};

export type ModeScan = {
  readonly startsAt: number;
  /** Exclusive upper bound of the account index. */
  readonly stopAt: number;
  readonly mandatoryEmptyAccountSkip: number;
  readonly supportsIndex: (index: number) => boolean;
};

const specOf = (mode: DerivationMode): DerivationModeSpec => DERIVATION_MODES[mode];

/** The modes a currency is scanned with, in scan order. By convention the last is the standard one. */
export function derivationModesOf(currency: CryptoCurrency): DerivationMode[] {
  const modes: DerivationMode[] = [...(LEGACY_MODES[currency.id] ?? [])];
  if (currency.forkedFrom) {
    modes.push("unsplit");
    if (currency.supportsSegwit) modes.push("segwit_unsplit");
  }
  if (currency.supportsNativeSegwit) modes.push("native_segwit");
  if (WITH_TAPROOT.has(currency.id)) modes.push("taproot");
  if (currency.supportsSegwit) modes.push("segwit");
  if (!WITHOUT_BIP44.has(currency.id)) modes.push("");
  return modes;
}

export function scanOf(
  currency: CryptoCurrency,
  mode: DerivationMode,
  rules: ScanRules = {},
): ModeScan {
  const spec = specOf(mode);
  return {
    startsAt: spec.startsAt ?? 0,
    stopAt: spec.isNonIterable ? 1 : MAX_ACCOUNT_INDEX,
    mandatoryEmptyAccountSkip: Math.max(
      spec.mandatoryEmptyAccountSkip ?? 0,
      MANDATORY_EMPTY_ACCOUNT_SKIP_BY_CURRENCY[currency.id] ?? 0,
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
  const modes = derivationModesOf(currency);
  if (modes.at(-1) === mode || mode === "segwit") return true;
  if (mode === "" && rules.showLegacyNewAccount) return true;
  return CREATABLE_MODES_BY_FAMILY[currency.family]?.includes(mode) ?? false;
}

/** The scheme of a mode, as `getDerivationScheme`. */
export function derivationSchemeOf(currency: CryptoCurrency, mode: DerivationMode): string {
  const spec = specOf(mode);
  if (spec.overridesDerivation) return spec.overridesDerivation;
  const forkedFrom = spec.isUnsplit ? currency.forkedFrom : undefined;
  const coinType = forkedFrom ? getCryptoCurrencyById(forkedFrom).coinType : "<coin_type>";
  return `${spec.purpose ?? 44}'/${coinType}'/<account>'/<node>/<address>`;
}

/** The scheme filled for an account: its first address, as `runDerivationScheme`. */
export function addressPathOf(scheme: string, coinType: number, index: number): string {
  return scheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(index))
    .replace("<node>", "0")
    .replace("<address>", "0");
}

/** The account part of the scheme filled, as `runAccountDerivationScheme` without its placeholder segments. */
export function accountPathOf(scheme: string, coinType: number, index: number): string {
  const segments = scheme
    .replace("<coin_type>", String(coinType))
    .replace("<account>", String(index))
    .split("/");
  // The segments after the account level, a node or an address, hardened or not (Polkadot's `<address>'`).
  while (segments.length > 0 && /<(node|address)>/.test(segments.at(-1) ?? "")) {
    segments.pop();
  }
  return segments.join("/");
}

const toDescriptorPath = (schemePath: string) => canonicalPath(`m/${schemePath}`);

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
    accountPath: toDescriptorPath(accountPathOf(scheme, currency.coinType, index)),
    addressPath: toDescriptorPath(addressPathOf(scheme, currency.coinType, index)),
  });
}
