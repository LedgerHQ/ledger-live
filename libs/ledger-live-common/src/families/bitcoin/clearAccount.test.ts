import { clearAccount } from "./clearAccount";
import { initialBitcoinResourcesValue, type BitcoinAccount } from "./types";

it("resets bitcoinResources to initial value", () => {
  const account = {
    bitcoinResources: { utxos: [{}], accountState: { version: 1 } },
  } as unknown as BitcoinAccount;
  clearAccount(account);
  expect(account.bitcoinResources).toBe(initialBitcoinResourcesValue);
  expect(account.bitcoinResources).toEqual({ utxos: [] });
});
