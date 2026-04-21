jest.mock("@ledgerhq/coin-bitcoin/types", () => ({
  initialBitcoinResourcesValue: { utxos: [] },
}));

import { clearAccount } from "./clearAccount";
import { initialBitcoinResourcesValue } from "@ledgerhq/coin-bitcoin/types";

it("resets bitcoinResources to initial value", () => {
  const account = { bitcoinResources: { utxos: [{}] } } as any;
  clearAccount(account);
  expect(account.bitcoinResources).toBe(initialBitcoinResourcesValue);
});
