import {
  candidateOf,
  DerivationModeSchema,
  derivationModesOf,
  offersNewAccount,
  scanOf,
} from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  derivationModeSupportsIndex,
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
import { listSupportedCurrencies } from "../currencies";

const currencies = listSupportedCurrencies();
const legacyPath = (scheme: string) => `m/${scheme}`.replaceAll("'", "h");
/** The legacy account path keeps a hardened address placeholder (Polkadot `…/0'/_'`): not a path. */
const withoutPlaceholders = (path: string) => path.replace(/(\/_'?)+$/, "");

/** `@domain/entity-derivation` mirrors what a scan reads of `derivation.ts`: see domain/entity/derivation/README.md. */
describe("@domain/entity-derivation against ledger-wallet-framework/derivation", () => {
  it("has the same modes", () => {
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
        expect([mode, [0, 1].map(scan.supportsIndex)]).toEqual([
          mode,
          [0, 1].map(index => derivationModeSupportsIndex(mode, index)),
        ]);
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
});
