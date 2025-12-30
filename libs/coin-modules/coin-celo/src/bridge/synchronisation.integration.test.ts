import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getAccountShape, clearEvmApiInstance } from "./synchronisation";
import { setCoinConfig, EvmCoinConfig } from "@ledgerhq/coin-evm/config";
import BigNumber from "bignumber.js";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";

const defaultInfo = {
  address: "0x6D03813A75c71e55401aFcAE02fb299416Dc8574",
  currency: getCryptoCurrencyById("celo"),
  index: 0,
  derivationPath: "44'/52752'/0'",
  derivationMode: "",
  initialAccount: undefined,
} as const;

const defaultConfig = { blacklistedTokenIds: [], paginationConfig: {} };

describe("Integration — getAccountShape with real implementations", () => {
  beforeAll(() => {
    // Setup a mock CryptoAssetsStore for tests which goes out of the scope of this test
    // was plannning to test blacklisted token configuration, but without real token data from store it's not possible
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "0",
    } as CryptoAssetsStore);

    setCoinConfig(
      () =>
        ({
          info: {
            node: {
              type: "external",
              uri: "https://celo.coin.ledger.com/archive",
            },
            explorer: {
              type: "blockscout",
              uri: "https://celo.blockscout.com/api",
            },
          },
        }) as unknown as EvmCoinConfig,
    );
  });
  afterEach(() => {
    clearEvmApiInstance();
  });

  it("should fetch account data with expected structure", async () => {
    const result = await getAccountShape(defaultInfo, defaultConfig);

    expect(result.balance).toEqual(BigNumber(996309127371000000));
    expect(result.spendableBalance).toEqual(BigNumber(696309127371000000));
    expect(result.blockHeight).toBeGreaterThan(0);
    expect(result.operations?.length).toBeGreaterThan(0);
    expect(result.celoResources?.lockedBalance).toEqual(BigNumber(300000000000000000));
    expect(result.celoResources?.nonvotingLockedBalance).toEqual(BigNumber(300000000000000000));
  }, 10000);

  it("should get account without locked balance", async () => {
    // Call with real implementations - will connect to actual network endpoints
    const result = await getAccountShape(
      { ...defaultInfo, address: "0x200a27e7a6b07af5883682930addda1941b115f3" },
      defaultConfig,
    );

    expect(result.balance).toEqual(BigNumber(7874979000000000));
    expect(result.spendableBalance).toEqual(BigNumber(7874979000000000));
    expect(result.celoResources?.lockedBalance).toEqual(BigNumber(0));
    expect(result.celoResources?.nonvotingLockedBalance).toEqual(BigNumber(0));
  }, 10000);
});
