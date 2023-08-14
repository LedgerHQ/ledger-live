import "../../__tests__/test-helpers/setup";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { listSupportedCurrencies } from "../../currencies";
test("all bitcoin forks that have a manager app have a defined address in abandonSeedLegacyPerCurrency", () => {
  const currenciyIds = listSupportedCurrencies()
    .filter(c => c.family === "bitcoin" && c.managerAppName)
    .map(c => c.id)
    .sort();
  expect(currenciyIds.every(id => getAbandonSeedAddress(id) !== undefined)).toEqual(true);
});
