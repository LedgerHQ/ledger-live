import { mapTxToOps } from "./misc";
import { fetchFullTxs } from "../../network/index";
import type { Operation, CryptoAssetsStore } from "@ledgerhq/types-live";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";

const Address = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

describe("misc integration tests", () => {
  beforeAll(() => {
    // Initialize CryptoAssetsStore for integration tests
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "0",
    } as CryptoAssetsStore);
  });

  test("convert raw transactions to live operations", async () => {
    const [rawTxs] = await fetchFullTxs(Address);
    const operations: Operation[] = rawTxs.flatMap(mapTxToOps("dummyAccountID", Address));

    expect(operations).toBeDefined();
    expect(operations.length).toBeGreaterThan(0);
  }, 60000);
});
