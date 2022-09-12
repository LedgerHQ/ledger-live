import "./live-common-set-supported-currencies";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";

test("No duplicate in the list of supported currencies on LLD", () => {
  const supportedCurrenciesIds = listSupportedCurrencies().map(c => c.id);
  const hasDuplicates = new Set(supportedCurrenciesIds).size !== supportedCurrenciesIds.length;
  expect(hasDuplicates).toBeFalsy();
});
