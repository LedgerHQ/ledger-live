// A test files that can contains generic failsafe we have for LLD
import "./live-common-set-supported-currencies";
import {
  getAbandonSeedAddress,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/lib/currencies/index";

describe("supported currencies are ready to work for LLD", () => {
  listSupportedCurrencies().forEach(c =>
    test("getAbandonSeedAddress works for currency " + c.id, () =>
      expect(getAbandonSeedAddress(c.id)).toBeTruthy(),
    ),
  );
});
