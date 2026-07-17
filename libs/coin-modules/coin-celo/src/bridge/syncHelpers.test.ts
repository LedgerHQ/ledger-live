import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getSyncHash as baseGetSyncHash } from "@ledgerhq/ledger-wallet-framework/account/sync";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import type { TokenCurrency, CryptoCurrencyId } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { getCoinConfig } from "@ledgerhq/coin-evm/config";
import { makeAccount, makeOperation, makeTokenAccount } from "./syncHelpers.fixtures";
import { createSwapHistoryMap, getSyncHash, mergeSubAccounts } from "./syncHelpers";

jest.mock("@ledgerhq/coin-evm/config");
const mockGetConfig = jest.mocked(getCoinConfig);

jest.mock("@ledgerhq/ledger-wallet-framework/account/sync");
const mockedBaseGetSyncHash = jest.mocked(baseGetSyncHash);

const CUSD_TOKEN = {
  type: "TokenCurrency",
  id: "celo/erc20/celo_dollar",
  contractAddress: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  parentCurrencyId: "celo",
  tokenType: "erc20",
  name: "Celo Dollar",
  ticker: "cUSD",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "Celo Dollar", code: "cUSD", magnitude: 18 }],
} as TokenCurrency;

const CEUR_TOKEN = {
  type: "TokenCurrency",
  id: "celo/erc20/celo_euro",
  contractAddress: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
  parentCurrencyId: "celo",
  tokenType: "erc20",
  name: "Celo Euro",
  ticker: "cEUR",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "Celo Euro", code: "cEUR", magnitude: 18 }],
} as TokenCurrency;

mockGetConfig.mockImplementation((currencyId: string): any => {
  switch (currencyId) {
    case "celo": {
      return {
        info: {
          node: { type: "external", uri: "celo_uri" },
          explorer: { type: "blockscout", uri: "celo" },
        },
      };
    }
    case "matic": {
      return {
        info: {
          node: { type: "ledger", explorerId: "matic" },
          explorer: { type: "ledger", explorerId: "matic" },
        },
      };
    }
    case "anything": {
      return {
        info: {
          node: { type: "external", explorerId: "anything" },
          explorer: { type: "etherscan", uri: "anything" },
        },
      };
    }
    case "somethingelse": {
      return {
        info: {
          node: { type: "ledger", explorerId: "somethingelse" },
          explorer: { type: "blockscout", uri: "somethingelse" },
        },
      };
    }
  }
});

describe("Celo sync helpers", () => {
  describe("mergeSubAccounts", () => {
    it("should merge 2 different sub accounts", () => {
      const tokenAccount1 = {
        ...makeTokenAccount("0xcafe", CUSD_TOKEN),
        balance: new BigNumber(1),
        operations: [],
      };
      const tokenAccount2 = {
        ...makeTokenAccount("0xcafe", CEUR_TOKEN),
        balance: new BigNumber(2),
        operations: [],
      };
      const account = makeAccount("0xcafe", getCryptoCurrencyById("celo"), [tokenAccount1]);

      const newSubAccounts = mergeSubAccounts(account, [tokenAccount2]);
      expect(newSubAccounts).toEqual([tokenAccount1, tokenAccount2]);
      expect(newSubAccounts).not.toBe(account.subAccounts); // shouldn't mutate original account
      expect(account.subAccounts).toEqual([tokenAccount1]); // shouldn't mutate original account
      expect(newSubAccounts[0]).toBe(account.subAccounts?.[0]); // keeping the reference though
    });

    it("should merge 2 different sub accounts and update the first one", () => {
      const tokenAccount1 = {
        ...makeTokenAccount("0xcafe", CUSD_TOKEN),
        balance: new BigNumber(1),
        operations: [],
      };
      const tokenAccount1Bis = {
        ...tokenAccount1,
        balance: new BigNumber(10),
        spendableBalance: new BigNumber(11),
        operationsCount: 0,
        balanceHistoryCache: {
          HOUR: {
            latestDate: 123,
            balances: [123],
          },
          DAY: {
            latestDate: 234,
            balances: [234],
          },
          WEEK: {
            latestDate: 345,
            balances: [345],
          },
        },
        operations: [],
      };
      const tokenAccount2 = {
        ...makeTokenAccount("0xcafe", CEUR_TOKEN),
        balance: new BigNumber(2),
        operations: [],
      };
      const account = makeAccount("0xcafe", getCryptoCurrencyById("celo"), [tokenAccount1]);

      const newSubAccounts = mergeSubAccounts(account, [tokenAccount1Bis, tokenAccount2]);
      expect(newSubAccounts).toEqual([tokenAccount1Bis, tokenAccount2]);
      expect(newSubAccounts).not.toBe(account.subAccounts); // shouldn't mutate original account
      expect(account.subAccounts).toEqual([tokenAccount1]); // shouldn't mutate original account
      expect(newSubAccounts[0]).not.toBe(account.subAccounts?.[0]); // changing the ref as a change happened in tokenAccount1
    });

    it("should update subAccount ops", () => {
      const op1 = makeOperation();
      const op2 = makeOperation({
        hash: "0xdiffHash",
      });
      const op3 = makeOperation({
        hash: "0xAgAinAnotHeRH4sh",
      });
      const tokenAccount1 = {
        ...makeTokenAccount("0xcafe", CUSD_TOKEN),
        balance: new BigNumber(1),
        operations: [op1, op2],
        operationsCount: 2,
      };
      const tokenAccount1Bis = {
        ...tokenAccount1,
        operations: [op3, op1, op2],
        operationsCount: 3,
      };
      const account = makeAccount("0xcafe", getCryptoCurrencyById("celo"), [tokenAccount1]);

      const newSubAccounts = mergeSubAccounts(account, [tokenAccount1Bis]);
      expect(newSubAccounts).not.toBe(account.subAccounts); // shouldn't mutate original account
      expect(account.subAccounts).toEqual([tokenAccount1]); // shouldn't mutate original account
      expect(newSubAccounts[0]).not.toBe(account.subAccounts?.[0]); // changing the ref as change happened
      expect(newSubAccounts[0]?.operations?.[1]).toBe(account.subAccounts?.[0]?.operations?.[0]); // keeping the reference for the ops though
      expect(newSubAccounts[0]?.operations?.[2]).toBe(account.subAccounts?.[0]?.operations?.[1]); // keeping the reference for the ops though
      expect(newSubAccounts).toEqual([tokenAccount1Bis]);
    });

    it("should return only new sub accounts", () => {
      const tokenAccount = {
        ...makeTokenAccount("0xcafe", CUSD_TOKEN),
        balance: new BigNumber(1),
      };
      const account = {
        ...makeAccount("0xcafe", getCryptoCurrencyById("celo")),
      };
      delete account.subAccounts;

      const newSubAccounts = mergeSubAccounts(account, [tokenAccount]);
      expect(newSubAccounts).toEqual([tokenAccount]);
      expect(account.subAccounts).toBe(undefined); // shouldn't mutate original account
    });

    it("should dedup sub accounts", () => {
      const tokenAccount = {
        ...makeTokenAccount("0xcafe", CUSD_TOKEN),
        balance: new BigNumber(1),
      };
      const account = makeAccount("0xcafe", getCryptoCurrencyById("celo"), [tokenAccount]);

      const newSubAccounts = mergeSubAccounts(account, [
        tokenAccount,
        { ...tokenAccount },
        { ...tokenAccount },
      ]);
      expect(newSubAccounts).toEqual([tokenAccount]);
    });
  });

  describe("createSwapHistoryMap", () => {
    it("returns an empty map if initialAccount is undefined", () => {
      const swapHistory = createSwapHistoryMap(undefined);
      expect(swapHistory.size).toBe(0);
    });
    it("returns an empty map if there are no subAccounts", () => {
      const account = makeAccount("0xcafe", getCryptoCurrencyById("celo"), []);
      const swapHistory = createSwapHistoryMap(account);
      expect(swapHistory.size).toBe(0);
    });

    it("maps TokenAccounts to their swapHistory", () => {
      const tokenAccount1 = {
        ...makeTokenAccount("0xcafe1", CUSD_TOKEN),
        swapHistory: [
          {
            status: "pending",
            provider: "moonpay",
            operationId: "js:2:celo:0xcafe:+celo%2Ferc20%2Fcelo_dollar-OUT",
            swapId: "swap1",
            receiverAccountId: "js:2:celo:0xcafe:",
            fromAmount: new BigNumber("200000"),
            toAmount: new BigNumber("129430000"),
          },
        ],
      };
      const tokenAccount2 = {
        ...makeTokenAccount("0xcafe2", CEUR_TOKEN),
        swapHistory: [
          {
            status: "pending",
            provider: "moonpay",
            operationId: "js:2:celo:0xcafe:+celo%2Ferc20%2Fcelo_euro-OUT",
            swapId: "swap2",
            receiverAccountId: "js:2:celo:0xcafe:",
            fromAmount: new BigNumber("200000"),
            toAmount: new BigNumber("129430000"),
          },
        ],
      };

      const account = makeAccount("0xcafe", getCryptoCurrencyById("celo"), [
        tokenAccount1,
        tokenAccount2,
      ]);
      const swapHistory = createSwapHistoryMap(account);

      expect(swapHistory.size).toBe(2);
      expect(swapHistory.get(tokenAccount1.token.id)).toEqual(tokenAccount1.swapHistory);
      expect(swapHistory.get(tokenAccount2.token.id)).toEqual(tokenAccount2.swapHistory);
    });
    it("should include correct swapHistory for a token account", () => {
      const tokenAccount = {
        ...makeTokenAccount("0xcafe", CUSD_TOKEN),
        swapHistory: [
          {
            status: "pending",
            provider: "moonpay",
            operationId: "js:2:celo:0xcafe:+celo%2Ferc20%2Fcelo_dollar-OUT",
            swapId: "6342cd15-5aa9-4c8c-9fb3-0b67e9b0714a",
            receiverAccountId: "js:2:celo:0xcafe:",
            tokenId: "celo/erc20/celo_dollar",
            fromAmount: new BigNumber("200000"),
            toAmount: new BigNumber("129430000"),
          },
        ],
      };
      const account = makeAccount("0xcafe", getCryptoCurrencyById("celo"), [tokenAccount]);

      const swapHistoryMap = createSwapHistoryMap(account);
      expect(swapHistoryMap.get(tokenAccount.token.id)).toEqual(tokenAccount.swapHistory);
    });
  });

  describe("getSyncHash", () => {
    const currency = getCryptoCurrencyById("celo");

    let oldEnv: string[];
    beforeAll(() => {
      oldEnv = getEnv<string[]>("NFT_CURRENCIES");
    });

    beforeEach(() => {
      mockedBaseGetSyncHash.mockClear();
      mockedBaseGetSyncHash.mockResolvedValue("some_random_hash");
    });

    afterEach(() => {
      jest.restoreAllMocks();
      setEnv("NFT_CURRENCIES", oldEnv);
    });

    it("should provide a valid hex hash", async () => {
      const syncHash = await getSyncHash(currency);
      expect(syncHash).toStrictEqual(expect.stringMatching(/^0x[A-Fa-f0-9]{8}$/));
    });

    it("should provide a new hash when the hash from the common getSyncHash change", async () => {
      const initialSyncHash = await getSyncHash(currency);
      mockedBaseGetSyncHash.mockClear();
      mockedBaseGetSyncHash.mockResolvedValueOnce("some_random_hash_2");
      const secondSyncHash = await getSyncHash(currency);
      expect(initialSyncHash).not.toEqual(secondSyncHash);
    });

    it("should provide a new hash if nft support is activated or not", async () => {
      setEnv("NFT_CURRENCIES", []);
      const hash1 = await getSyncHash(currency);
      setEnv("NFT_CURRENCIES", [currency.id]);
      const hash2 = await getSyncHash(currency);

      expect(hash1).not.toEqual(hash2);
    });

    it("should provide a new hash if currency is using a new node config", async () => {
      const hash1 = await getSyncHash({
        ...currency,
        id: "celo",
        ethereumLikeInfo: { chainId: 42220 },
      });
      const hash2 = await getSyncHash({
        ...currency,
        id: "matic" as CryptoCurrencyId,
        ethereumLikeInfo: { chainId: 42220 },
      });
      const hash3 = await getSyncHash({
        ...currency,
        id: "anything" as CryptoCurrencyId,
        ethereumLikeInfo: { chainId: 42220 },
      });
      const hash4 = await getSyncHash({
        ...currency,
        id: "somethingelse" as CryptoCurrencyId,
        ethereumLikeInfo: { chainId: 42220 },
      });

      const hashes = [hash1, hash2, hash3, hash4];
      const uniqueSet = new Set(hashes);

      expect(hashes).toEqual(Array.from(uniqueSet));
    });

    it("should provide a new hash if currency is using a new explorer config", async () => {
      const hash1 = await getSyncHash({
        ...currency,
        id: "celo",
      });
      const hash2 = await getSyncHash({
        ...currency,
        id: "matic" as CryptoCurrencyId,
      });
      const hash3 = await getSyncHash({
        ...currency,
        id: "anything" as CryptoCurrencyId,
      });
      const hash4 = await getSyncHash({
        ...currency,
        id: "somethingelse" as CryptoCurrencyId,
      });

      const hashes = [hash1, hash2, hash3, hash4];
      const uniqueSet = new Set(hashes);

      expect(hashes).toEqual(Array.from(uniqueSet));
    });
  });
});
