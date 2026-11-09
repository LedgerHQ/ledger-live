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
import { listSupportedCurrencies } from "../../currencies";

const currencies = listSupportedCurrencies();
const legacyPath = (scheme: string) => `m/${scheme}`.replaceAll("'", "h");

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
            legacyPath(runAccountDerivationScheme(scheme, currency, { account: index })),
          ]);
        }
        expect(typeof offersNewAccount(currency, mode)).toBe("boolean");
      }
    },
  );
});
