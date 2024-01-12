import BigNumber from "bignumber.js";
import { isController } from "./logic";
import { PolkadotAccount } from "./types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const polkadotAccount: PolkadotAccount = {
  type: "Account",
  id: "",
  seedIdentifier: "",
  derivationMode: "",
  freshAddress: "",
  freshAddressPath: "",
  name: "",
  starred: false,
  index: 0,
  freshAddresses: [],
  spendableBalance: new BigNumber(0),
  balance: new BigNumber(0),
  used: true,
  creationDate: new Date(),
  blockHeight: 0,
  currency: getCryptoCurrencyById("polkadot"),
  unit: { name: "DOT", code: "DOT", magnitude: 16 },
  operations: [],
  pendingOperations: [],
  operationsCount: 0,
  lastSyncDate: new Date(),
  balanceHistoryCache: {} as any,
  swapHistory: [],
  polkadotResources: {} as any,
};

describe("isController", () => {
  it("returns false when stash is not defined", () => {
    const accountIsController = isController(polkadotAccount);
    expect(accountIsController).toBe(false);
  });

  it("returns false when stash account is undefined or null", () => {
    polkadotAccount.polkadotResources.stash = null;
    const accountIsController = isController(polkadotAccount);
    expect(accountIsController).toBe(false);
  });

  it("returns true when stash account is defined", () => {
    polkadotAccount.polkadotResources.stash = "stashAddress";
    const accountIsController = isController(polkadotAccount);
    expect(accountIsController).toBe(true);
  });
});
