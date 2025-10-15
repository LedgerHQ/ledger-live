// A test files that can contains generic failsafe we have for LLD
import "./live-common-set-supported-currencies";
import {
  getAbandonSeedAddress,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";

describe("supported currencies are ready to work for LLD", () => {
  // Skip bitcoin_regtest this one because it's only for cointester bitcoin
  listSupportedCurrencies()
    .filter(c => c.id !== "bitcoin_regtest")
    .forEach(c =>
      test("getAbandonSeedAddress works for currency " + c.id, () =>
        expect(getAbandonSeedAddress(c.id)).toBeTruthy(),
      ),
    );
});
