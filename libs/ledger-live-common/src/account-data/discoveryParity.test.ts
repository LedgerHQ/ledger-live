import { listSupportedCurrencies } from "../currencies";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationModeStartsAt,
  getDerivationModesForCurrency,
  getDerivationScheme,
  getMandatoryEmptyAccountSkip,
  isIterableDerivationMode,
  derivationModeSupportsIndex,
  runAccountDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { shouldShowNewAccount } from "@ledgerhq/ledger-wallet-framework/account/support";
import {
  accountLevelPathOf,
  accountPathOf,
  derivationModesOf,
  derivationSchemeOf,
  offersNewAccount,
  scanRulesOf,
} from "@features/platform-account-discovery";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

// The discovery table is a copy of derivation.ts: it must say what the legacy scan says.
describe("account discovery derivation table, against the legacy derivation", () => {
  const currencies = listSupportedCurrencies();

  it("covers currencies", () => {
    expect(currencies.length).toBeGreaterThan(50);
  });

  it.each(currencies.map(currency => [currency.id]))("%s", id => {
    const legacy = getCryptoCurrencyById(id);
    const currency = findCryptoCurrencyById(id);
    if (!currency) throw new Error(`${id} is missing from the domain currency registry`);

    const legacyModes = getDerivationModesForCurrency(legacy);
    expect(derivationModesOf(currency)).toEqual(legacyModes);

    for (const mode of legacyModes) {
      expect(derivationSchemeOf(currency, mode)).toBe(
        getDerivationScheme({ derivationMode: mode, currency: legacy }),
      );
      const rules = scanRulesOf(mode);
      expect(rules.startsAt).toBe(getDerivationModeStartsAt(mode));
      expect(rules.stopAt).toBe(isIterableDerivationMode(mode) ? 255 : 1);
      expect(rules.mandatoryEmptyAccountSkip).toBe(getMandatoryEmptyAccountSkip(mode));
      expect(rules.supportsIndex(0)).toBe(derivationModeSupportsIndex(mode, 0));
      expect(rules.supportsIndex(3)).toBe(derivationModeSupportsIndex(mode, 3));
      expect(offersNewAccount(currency, mode)).toBe(shouldShowNewAccount(legacy, mode));

      const scheme = getDerivationScheme({ derivationMode: mode, currency: legacy });
      for (const index of [0, 1, 7]) {
        expect(accountPathOf(scheme, legacy.coinType, index)).toBe(
          runDerivationScheme(scheme, legacy, { account: index }),
        );
        expect(accountLevelPathOf(scheme, legacy.coinType, index)).toBe(
          runAccountDerivationScheme(scheme, legacy, { account: index }),
        );
      }
    }
  });
});
