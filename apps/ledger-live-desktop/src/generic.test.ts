// A test files that can contains generic failsafe we have for LLD
import "./live-common-set-supported-currencies";
import {
  getAbandonSeedAddress,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";

describe("supported currencies are ready to work for LLD", () => {
  // Only test currencies that have an abandon seed address defined
  // Some currencies (e.g. clubcoin, hcash) are registered but have no abandon seed address
  listSupportedCurrencies()
    .filter(c => c.id !== "bitcoin_regtest")
    .filter(c => {
      try {
        return !!getAbandonSeedAddress(c.id);
      } catch {
        return false;
      }
    })
    .forEach(c =>
      test("getAbandonSeedAddress works for currency " + c.id, () =>
        expect(getAbandonSeedAddress(c.id)).toBeTruthy(),
      ),
    );
});
