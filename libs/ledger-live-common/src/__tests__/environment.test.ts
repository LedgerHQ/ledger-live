// A test files that can contains generic failsafe we have for LLD
import "./test-helpers/setup";

import { getAbandonSeedAddress, listSupportedCurrencies } from "../currencies";

describe("supported currencies are ready to work", () => {
  listSupportedCurrencies().forEach((c) =>
    test("getAbandonSeedAddress works for currency " + c.id, () =>
      expect(getAbandonSeedAddress(c.id)).toBeTruthy()
    )
  );
});
