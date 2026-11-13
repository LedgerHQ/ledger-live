import {
  candidateOf,
  derivationModesOf,
  offersNewAccount,
  scanOf,
} from "@domain/entity-derivation";
import {
  getDerivationModesForCurrency,
  getDerivationModeStartsAt,
  getDerivationScheme,
  getMandatoryEmptyAccountSkip,
  isIterableDerivationMode,
  runAccountDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { shouldShowNewAccount } from "@ledgerhq/ledger-wallet-framework/account/support";
import { listSupportedCurrencies } from "../../currencies";
import { legacyScanRules } from "./legacyScanRules";

const scanEnv = { KEYCHAIN_OBSERVABLE_RANGE: 0, SHOW_LEGACY_NEW_ACCOUNT: false };
jest.mock("@ledgerhq/ledger-wallet-framework/scanRules", () => ({
  getKeychainObservableRange: () => scanEnv.KEYCHAIN_OBSERVABLE_RANGE,
  showsLegacyNewAccount: () => scanEnv.SHOW_LEGACY_NEW_ACCOUNT,
}));

const currencies = listSupportedCurrencies();
const legacyPath = (scheme: string) => `m/${scheme}`.replaceAll("'", "h");
/** The legacy account path keeps a hardened address placeholder (Polkadot `…/0'/_'`): not a path. */
const withoutPlaceholders = (path: string) => path.replace(/(\/_'?)+$/, "");

/** `@domain/entity-derivation` copies what a scan reads of `derivation.ts`: this keeps them in step. */
describe("@domain/entity-derivation against ledger-wallet-framework/derivation", () => {
  it("covers some currencies", () => {
    expect(currencies.length).toBeGreaterThan(50);
  });

  it.each(currencies.map(currency => [currency.id, currency] as const))(
    "%s: same modes, gap limits, bounds and paths",
    (_id, currency) => {
      const modes = getDerivationModesForCurrency(currency);
      expect(derivationModesOf(currency)).toEqual(modes);
      for (const mode of modes) {
        const scan = scanOf(currency, mode);
        expect([mode, scan.mandatoryEmptyAccountSkip]).toEqual([
          mode,
          getMandatoryEmptyAccountSkip(mode, currency),
        ]);
        expect([mode, scan.startsAt]).toEqual([mode, getDerivationModeStartsAt(mode)]);
        expect([mode, scan.stopAt]).toEqual([mode, isIterableDerivationMode(mode) ? 255 : 1]);
        const scheme = getDerivationScheme({ derivationMode: mode, currency });
        for (const index of [scan.startsAt, scan.startsAt + 1]) {
          const candidate = candidateOf(currency, mode, index);
          expect([mode, candidate.addressPath]).toEqual([
            mode,
            legacyPath(runDerivationScheme(scheme, currency, { account: index })),
          ]);
          expect([mode, candidate.accountPath]).toEqual([
            mode,
            legacyPath(
              withoutPlaceholders(runAccountDerivationScheme(scheme, currency, { account: index })),
            ),
          ]);
        }
        expect([mode, offersNewAccount(currency, mode)]).toEqual([
          mode,
          shouldShowNewAccount(currency, mode),
        ]);
      }
    },
  );

  describe.each([
    { KEYCHAIN_OBSERVABLE_RANGE: 20, SHOW_LEGACY_NEW_ACCOUNT: true },
    { KEYCHAIN_OBSERVABLE_RANGE: 0, SHOW_LEGACY_NEW_ACCOUNT: false },
  ])("with the env scan rules %o", env => {
    beforeAll(() => Object.assign(scanEnv, env));
    afterAll(() =>
      Object.assign(scanEnv, { KEYCHAIN_OBSERVABLE_RANGE: 0, SHOW_LEGACY_NEW_ACCOUNT: false }),
    );

    it.each(currencies.map(currency => [currency.id, currency] as const))(
      "%s: same gap limits and new accounts",
      (_id, currency) => {
        const rules = legacyScanRules();
        for (const mode of getDerivationModesForCurrency(currency)) {
          expect([mode, scanOf(currency, mode, rules).mandatoryEmptyAccountSkip]).toEqual([
            mode,
            getMandatoryEmptyAccountSkip(mode, currency),
          ]);
          expect([mode, offersNewAccount(currency, mode, rules)]).toEqual([
            mode,
            shouldShowNewAccount(currency, mode),
          ]);
        }
      },
    );
  });
});
