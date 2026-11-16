import {
  candidateOf,
  DerivationModeSchema,
  derivationModesOf,
  offersNewAccount,
  scanOf,
  type DerivationMode,
  type ScanRules,
} from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  getAllDerivationModes,
  getDerivationModesForCurrency,
  getDerivationModeStartsAt,
  getDerivationScheme,
  getMandatoryEmptyAccountSkip,
  isIterableDerivationMode,
  runAccountDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { shouldShowNewAccount } from "@ledgerhq/ledger-wallet-framework/account/support";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import type { DerivationMode as LegacyDerivationMode } from "@ledgerhq/types-live";
import { listSupportedCurrencies } from "../currencies";

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameModeUnion: Equals<DerivationMode, LegacyDerivationMode> = true;

const currencies = listSupportedCurrencies();
const legacyPath = (scheme: string) => `m/${scheme}`.replaceAll("'", "h");
/** The legacy account path keeps a hardened address placeholder (Polkadot `…/0'/_'`): not a path. */
const withoutPlaceholders = (path: string) => path.replace(/(\/_'?)+$/, "");

const envRules = (): ScanRules => ({
  keychainObservableRange: getEnv("KEYCHAIN_OBSERVABLE_RANGE"),
  showLegacyNewAccount: getEnv("SHOW_LEGACY_NEW_ACCOUNT"),
  scanForInvalidPaths: getEnv("SCAN_FOR_INVALID_PATHS"),
});

/** `@domain/entity-derivation` mirrors what a scan reads of `derivation.ts`: see domain/entity/derivation/README.md. */
describe("@domain/entity-derivation against ledger-wallet-framework/derivation", () => {
  it("has the same modes", () => {
    expect(sameModeUnion).toBe(true);
    const modes = getAllDerivationModes();
    expect(modes.length).toBeGreaterThan(40);
    expect(modes.filter(mode => !DerivationModeSchema.safeParse(mode).success)).toEqual([]);
  });

  it("covers some currencies", () => {
    expect(currencies.length).toBeGreaterThan(50);
  });

  it.each(currencies.map(currency => [currency.id, currency] as const))(
    "%s: same modes, gap limits, bounds and paths",
    (id, legacyCurrency) => {
      const currency = getCryptoCurrencyById(id);
      const modes = getDerivationModesForCurrency(legacyCurrency);
      expect(derivationModesOf(currency)).toEqual(modes);
      for (const mode of modes) {
        const scan = scanOf(currency, mode);
        expect([mode, scan.mandatoryEmptyAccountSkip]).toEqual([
          mode,
          getMandatoryEmptyAccountSkip(mode, legacyCurrency),
        ]);
        expect([mode, scan.startsAt]).toEqual([mode, getDerivationModeStartsAt(mode)]);
        expect([mode, scan.stopAt]).toEqual([mode, isIterableDerivationMode(mode) ? 255 : 1]);
        const scheme = getDerivationScheme({ derivationMode: mode, currency: legacyCurrency });
        for (const index of [scan.startsAt, scan.startsAt + 1]) {
          const candidate = candidateOf(currency, mode, index);
          expect([mode, candidate.addressPath]).toEqual([
            mode,
            legacyPath(runDerivationScheme(scheme, legacyCurrency, { account: index })),
          ]);
          expect([mode, candidate.accountPath]).toEqual([
            mode,
            legacyPath(
              withoutPlaceholders(
                runAccountDerivationScheme(scheme, legacyCurrency, { account: index }),
              ),
            ),
          ]);
        }
        expect([mode, offersNewAccount(currency, mode)]).toEqual([
          mode,
          shouldShowNewAccount(legacyCurrency, mode),
        ]);
      }
    },
  );

  describe.each([
    { KEYCHAIN_OBSERVABLE_RANGE: 20, SHOW_LEGACY_NEW_ACCOUNT: true },
    { KEYCHAIN_OBSERVABLE_RANGE: 0, SHOW_LEGACY_NEW_ACCOUNT: false },
  ])("with the env scan rules %o", env => {
    const initial = envRules();
    beforeAll(() => {
      setEnv("KEYCHAIN_OBSERVABLE_RANGE", env.KEYCHAIN_OBSERVABLE_RANGE);
      setEnv("SHOW_LEGACY_NEW_ACCOUNT", env.SHOW_LEGACY_NEW_ACCOUNT);
    });
    afterAll(() => {
      setEnv("KEYCHAIN_OBSERVABLE_RANGE", initial.keychainObservableRange ?? 0);
      setEnv("SHOW_LEGACY_NEW_ACCOUNT", initial.showLegacyNewAccount ?? false);
    });

    it.each(currencies.map(currency => [currency.id, currency] as const))(
      "%s: same gap limits and new accounts",
      (id, legacyCurrency) => {
        const currency = getCryptoCurrencyById(id);
        const rules = envRules();
        for (const mode of getDerivationModesForCurrency(legacyCurrency)) {
          expect([mode, scanOf(currency, mode, rules).mandatoryEmptyAccountSkip]).toEqual([
            mode,
            getMandatoryEmptyAccountSkip(mode, legacyCurrency),
          ]);
          expect([mode, offersNewAccount(currency, mode, rules)]).toEqual([
            mode,
            shouldShowNewAccount(legacyCurrency, mode),
          ]);
        }
      },
    );
  });
});
