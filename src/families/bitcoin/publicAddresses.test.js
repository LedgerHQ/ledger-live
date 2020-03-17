// @flow

import { abandonSeedLegacyPerCurrency } from "./publicAddresses";
import { listCryptoCurrencies } from "../../currencies";

const ignore = ["bitcloud", "bitcore", "bitsend", "clubcoin", "megacoin"];

test("all bitcoin forks that have a manager app have a defined address in abandonSeedLegacyPerCurrency", () => {
  const currencies = listCryptoCurrencies(true)
    .filter(
      c => c.family === "bitcoin" && c.managerAppName && !ignore.includes(c.id)
    )
    .map(c => c.id)
    .sort();
  const keys = Object.keys(abandonSeedLegacyPerCurrency).sort();
  expect(currencies).toEqual(keys);
});
