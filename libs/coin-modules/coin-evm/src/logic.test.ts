import { getSyncHash as baseGetSyncHash } from "@ledgerhq/coin-framework/account/sync";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import * as EVM_TOOLS from "@ledgerhq/evm-tools/message/EIP712/index";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { CryptoCurrencyId, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

jest.mock("./network/node/rpc.common", () => ({
  ...jest.requireActual("./network/node/rpc.common"),
  getOptimismAdditionalFees: jest.fn(),
  getScrollAdditionalFees: jest.fn(),
}));

const mockGetOptimismAdditionalFees = getOptimismAdditionalFees as jest.Mock;
const mockGetScrollAdditionalFees = getScrollAdditionalFees as jest.Mock;
import { getCoinConfig } from "./config";
import { makeAccount, makeOperation, makeTokenAccount } from "./fixtures/common.fixtures";
import usdCoinTokenData from "./fixtures/ethereum-erc20-usd__coin.json";
import wethTokenData from "./fixtures/ethereum-erc20-weth.json";
import {
  createSwapHistoryMap,
  getAdditionalLayer2Fees,
  getMessageProperties,
  getSyncHash,
  mergeSubAccounts,
} from "./logic";
import { getOptimismAdditionalFees, getScrollAdditionalFees } from "./network/node/rpc.common";
import { Transaction as EvmTransaction } from "./types";
import { getEstimatedFees, getGasLimit, padHexString, safeEncodeEIP55 } from "./utils";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const USD_COIN_TOKEN = usdCoinTokenData as unknown as TokenCurrency;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const WETH_TOKEN = wethTokenData as unknown as TokenCurrency;

jest.mock("./config");
const mockGetConfig = jest.mocked(getCoinConfig);

jest.mock("@ledgerhq/coin-framework/account/sync");
const mockedBaseGetSyncHash = jest.mocked(baseGetSyncHash);

mockGetConfig.mockImplementation((currency: { id: string }): any => {
  switch (currency.id) {
    case "ethereum": {
      return {
        info: {
          node: { type: "ledger", explorerId: "eth" },
          explorer: { type: "ledger", explorerId: "eth" },
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
    case "optimism": {
      return {
        info: {
          node: { type: "external", uri: "optimism_uri" },
        },
      };
    }
    case "scroll": {
      return {
        info: {
          node: { type: "external", uri: "scroll_uri" },
        },
      };
    }
    case "polygon": {
      return {
        info: {
          node: { type: "ledger", explorerId: "polygon" },
        },
      };
    }
    case "bsc": {
      return {
        info: {
          node: { type: "ledger", explorerId: "bsc" },
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

describe("EVM Family", () => {
  describe("logic.ts", () => {
    describe("getGasLimit", () => {
      it("should return the gasLimit when no customGasLimit provided", () => {
        const tx: Partial<EvmTransaction> = {
          gasLimit: new BigNumber(100),
          customGasLimit: undefined as any,
        };

        expect(getGasLimit(tx as any)).toEqual(new BigNumber(100));
      });

      it("should return the customGasLimit when provided", () => {
        const tx: Partial<EvmTransaction> = {
          gasLimit: new BigNumber(100),
          customGasLimit: new BigNumber(200),
        };

        expect(getGasLimit(tx as any)).toEqual(new BigNumber(200));
      });
    });

    describe("getEstimatedFees", () => {
      describe("without customGasLimit", () => {
        it("should return the right fee estimation for a legacy tx", () => {
          const tx = {
            type: 0,
            gasLimit: new BigNumber(3),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(100),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(69));
        });

        it("should return the right fee estimation for a 1559 tx", () => {
          const tx = {
            type: 2,
            gasLimit: new BigNumber(42),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(10),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(420));
        });
      });

      describe("with customGasLimit", () => {
        it("should return the right fee estimation for a legacy tx", () => {
          const tx = {
            type: 0,
            gasLimit: new BigNumber(4),
            customGasLimit: new BigNumber(3),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(100),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(69));
        });

        it("should return the right fee estimation for a 1559 tx", () => {
          const tx = {
            type: 2,
            gasLimit: new BigNumber(43),
            customGasLimit: new BigNumber(42),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(10),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(420));
        });
      });

      it("should fallback with tx without type", () => {
        const tx = {};
        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(0));
      });

      it("should fallback with badly formatted legacy tx", () => {
        const tx = {
          type: 0,
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(0));
      });

      it("should fallback with badly formatted 1559 tx", () => {
        const tx = {
          type: 2,
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(0));
      });
    });

    describe("getAdditionalLayer2Fees", () => {
      const optimism = getCryptoCurrencyById("optimism");
      const scroll = getCryptoCurrencyById("scroll");
      const ethereum = getCryptoCurrencyById("ethereum");

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should try to get additionalFees for a valid layer 2", async () => {
        mockGetOptimismAdditionalFees.mockClear();
        mockGetScrollAdditionalFees.mockClear();

        await getAdditionalLayer2Fees(optimism, {} as any);
        expect(mockGetOptimismAdditionalFees).toHaveBeenCalled();
        await getAdditionalLayer2Fees(scroll, {} as any);
        expect(mockGetScrollAdditionalFees).toHaveBeenCalled();
      });

      it("should not try to get additionalFees for an invalid layer 2", async () => {
        mockGetOptimismAdditionalFees.mockClear();
        mockGetScrollAdditionalFees.mockClear();

        await getAdditionalLayer2Fees(ethereum, {} as any);
        expect(mockGetOptimismAdditionalFees).not.toHaveBeenCalled();
        expect(mockGetScrollAdditionalFees).not.toHaveBeenCalled();
      });
    });

    describe("mergeSubAccounts", () => {
      it("should merge 2 different sub accounts", () => {
        const tokenAccount1 = {
          ...makeTokenAccount("0xkvn", USD_COIN_TOKEN),
          balance: new BigNumber(1),
          operations: [],
        };
        const tokenAccount2 = {
          ...makeTokenAccount("0xkvn", WETH_TOKEN),
          balance: new BigNumber(2),
          operations: [],
        };
        const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [tokenAccount1]);

        const newSubAccounts = mergeSubAccounts(account, [tokenAccount2]);
        expect(newSubAccounts).toEqual([tokenAccount1, tokenAccount2]);
        expect(newSubAccounts).not.toBe(account.subAccounts); // shouldn't mutate original account
        expect(account.subAccounts).toEqual([tokenAccount1]); // shouldn't mutate original account
        expect(newSubAccounts[0]).toBe(account.subAccounts?.[0]); // keeping the reference though
      });

      it("should merge 2 different sub accounts and update the first one", () => {
        const tokenAccount1 = {
          ...makeTokenAccount("0xkvn", USD_COIN_TOKEN),
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
          ...makeTokenAccount("0xkvn", WETH_TOKEN),
          balance: new BigNumber(2),
          operations: [],
        };
        const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [tokenAccount1]);

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
          ...makeTokenAccount("0xkvn", USD_COIN_TOKEN),
          balance: new BigNumber(1),
          operations: [op1, op2],
          operationsCount: 2,
        };
        const tokenAccount1Bis = {
          ...tokenAccount1,
          operations: [op3, op1, op2],
          operationsCount: 3,
        };
        const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [tokenAccount1]);

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
          ...makeTokenAccount("0xkvn", USD_COIN_TOKEN),
          balance: new BigNumber(1),
        };
        const account = {
          ...makeAccount("0xkvn", getCryptoCurrencyById("ethereum")),
        };
        delete account.subAccounts;

        const newSubAccounts = mergeSubAccounts(account, [tokenAccount]);
        expect(newSubAccounts).toEqual([tokenAccount]);
        expect(account.subAccounts).toBe(undefined); // shouldn't mutate original account
      });

      it("should dedup sub accounts", () => {
        const tokenAccount = {
          ...makeTokenAccount("0xkvn", USD_COIN_TOKEN),
          balance: new BigNumber(1),
        };
        const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [tokenAccount]);

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
        const account = makeAccount("0xCrema", getCryptoCurrencyById("ethereum"), []);
        const swapHistory = createSwapHistoryMap(account);
        expect(swapHistory.size).toBe(0);
      });

      it("maps TokenAccounts to their swapHistory", () => {
        const tokenAccount1 = {
          ...makeTokenAccount("0xCrema1", USD_COIN_TOKEN),
          swapHistory: [
            {
              status: "pending",
              provider: "moonpay",
              operationId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd__coin-OUT",
              swapId: "swap1",
              receiverAccountId: "js:2:ethereum:0xkvn:",
              fromAmount: new BigNumber("200000"),
              toAmount: new BigNumber("129430000"),
            },
          ],
        };
        const tokenAccount2 = {
          ...makeTokenAccount("0xCrema2", WETH_TOKEN),
          swapHistory: [
            {
              status: "pending",
              provider: "moonpay",
              operationId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fweth-OUT",
              swapId: "swap2",
              receiverAccountId: "js:2:ethereum:0xkvn:",
              fromAmount: new BigNumber("200000"),
              toAmount: new BigNumber("129430000"),
            },
          ],
        };

        const account = makeAccount("0xCrema", getCryptoCurrencyById("ethereum"), [
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
          ...makeTokenAccount("0xCrema", USD_COIN_TOKEN),
          swapHistory: [
            {
              status: "pending",
              provider: "moonpay",
              operationId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd__coin-OUT",
              swapId: "6342cd15-5aa9-4c8c-9fb3-0b67e9b0714a",
              receiverAccountId: "js:2:ethereum:0xkvn:",
              tokenId: "ethereum/erc20/usd__coin",
              fromAmount: new BigNumber("200000"),
              toAmount: new BigNumber("129430000"),
            },
          ],
        };
        const account = makeAccount("0xCrema", getCryptoCurrencyById("ethereum"), [tokenAccount]);

        const swapHistoryMap = createSwapHistoryMap(account);
        expect(swapHistoryMap.get(tokenAccount.token.id)).toEqual(tokenAccount.swapHistory);
      });
    });
    describe("getSyncHash", () => {
      const currency = getCryptoCurrencyById("ethereum");

      let oldEnv: string[];
      beforeAll(() => {
        oldEnv = getEnv("NFT_CURRENCIES");
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
          id: "ethereum",
          ethereumLikeInfo: { chainId: 1 },
        });
        const hash2 = await getSyncHash({
          ...currency,
          id: "matic" as CryptoCurrencyId,
          ethereumLikeInfo: { chainId: 1 },
        });
        const hash3 = await getSyncHash({
          ...currency,
          id: "anything" as CryptoCurrencyId,
          ethereumLikeInfo: { chainId: 1 },
        });
        const hash4 = await getSyncHash({
          ...currency,
          id: "somethingelse" as CryptoCurrencyId,
          ethereumLikeInfo: { chainId: 1 },
        });

        const hashes = [hash1, hash2, hash3, hash4];
        const uniqueSet = new Set(hashes);

        expect(hashes).toEqual(Array.from(uniqueSet));
      });

      it("should provide a new hash if currency is using a new explorer config", async () => {
        const hash1 = await getSyncHash({
          ...currency,
          id: "ethereum",
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

    describe("padHexString", () => {
      it("should always return an odd number of characters", () => {
        expect(padHexString("1")).toEqual("01");
        expect(padHexString("01")).toEqual("01");
      });
    });

    describe("safeEncodeEIP55", () => {
      it("Should return encoded address if valid address", () => {
        const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("0x9AA99C23F67c81701C772B106b4F83f6e858dd2E");
      });

      it("Should return empty string if empty address", () => {
        const address = "";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("");
      });

      it("Should return empty string if 0x0 address", () => {
        const address = "0x0";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("");
      });

      it("Should return empty string if 0x address", () => {
        const address = "0x";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("");
      });

      it("Should return address if invalid address", () => {
        const address = "0x00000";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe(address);
      });
    });

    describe("getMessageProperties", () => {
      it("should return null if the message isn't an EIP712", async () => {
        expect(await getMessageProperties({ standard: "EIP191", message: "doot-doot" })).toBe(null);
      });

      it("should return the fields displayed on the nano", async () => {
        jest.spyOn(EVM_TOOLS, "getEIP712FieldsDisplayedOnNano").mockResolvedValueOnce([
          {
            label: "key",
            value: "value",
          },
        ]);

        expect(
          await getMessageProperties({
            standard: "EIP712",
            message: {} as any,
            domainHash: "0xabc",
            hashStruct: "0xdef",
          }),
        ).toEqual([{ label: "key", value: "value" }]);
      });
    });
  });
});
