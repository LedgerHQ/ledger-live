import BigNumber from "bignumber.js";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import * as cryptoAssetsTokens from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../../types";
import * as RPC_API from "../../api/rpc/rpc.common";
import {
  deepFreeze,
  makeAccount,
  makeNftOperation,
  makeOperation,
  makeTokenAccount,
} from "../fixtures/common.fixtures";
import {
  attachOperations,
  eip1559TransactionHasFees,
  getAdditionalLayer2Fees,
  getEstimatedFees,
  getSyncHash,
  legacyTransactionHasFees,
  mergeSubAccounts,
} from "../../logic";

describe("EVM Family", () => {
  describe("logic.ts", () => {
    describe("legacyTransactionHasFees", () => {
      it("should return true for legacy tx with fees", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          type: 0,
          gasPrice: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as EvmTransactionLegacy)).toBe(true);
      });

      it("should return true for type 1 (unused in the live for now) tx with fees", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          type: 1,
          gasPrice: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as EvmTransactionLegacy)).toBe(true);
      });

      it("should return false for legacy tx without fees", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          type: 0,
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(false);
      });

      it("should return false for legacy tx with wrong fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 2,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(false);
      });

      it("should return true for legacy tx with fees but no type (default being a legacy tx)", () => {
        const tx: Partial<EvmTransactionLegacy> = {
          gasPrice: new BigNumber(100),
        };

        expect(legacyTransactionHasFees(tx as any)).toBe(true);
      });
    });

    describe("eip1559TransactionHasFess", () => {
      it("should return true for 1559 tx with fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 2,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(true);
      });

      it("should return false for 1559 tx without fees", () => {
        const tx: Partial<EvmTransactionEIP1559> = {
          type: 2,
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(false);
      });

      it("should return false for 1559 tx with wrong fees", () => {
        const tx: unknown = {
          type: 2,
          gasPrice: new BigNumber(100),
        };

        expect(eip1559TransactionHasFees(tx as any)).toBe(false);
      });
    });

    describe("getEstimatedFees", () => {
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

      it("should fallback with badly formatted 1559 tx", () => {
        const tx = {
          type: 2,
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(0));
      });
    });

    describe("getAdditionalLayer2Fees", () => {
      const optimism = getCryptoCurrencyById("optimism");
      const ethereum = getCryptoCurrencyById("ethereum");

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should try to get additionalFees for a valid layer 2", async () => {
        const spy = jest.spyOn(RPC_API, "getOptimismAdditionalFees").mockImplementation(jest.fn());

        await getAdditionalLayer2Fees(optimism, {} as any);
        expect(spy).toBeCalled();
      });

      it("should not try to get additionalFees for an invalid layer 2", async () => {
        const spy = jest.spyOn(RPC_API, "getOptimismAdditionalFees").mockImplementation(jest.fn());

        await getAdditionalLayer2Fees(ethereum, {} as any);
        expect(spy).not.toBeCalled();
      });
    });

    describe("mergeSubAccounts", () => {
      it("should merge 2 different sub accounts", () => {
        const tokenAccount1 = {
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin")),
          balance: new BigNumber(1),
          operations: [],
        };
        const tokenAccount2 = {
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/weth")),
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
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin")),
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
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/weth")),
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
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin")),
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
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin")),
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
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin")),
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

    describe("getSyncHash", () => {
      const currency = getCryptoCurrencyById("ethereum");

      let oldEnv: string;
      beforeAll(() => {
        oldEnv = getEnv("NFT_CURRENCIES");
      });

      afterEach(() => {
        jest.restoreAllMocks();
        setEnv("NFT_CURRENCIES", oldEnv);
      });

      it("should provide a valid sha256 hash", () => {
        expect(getSyncHash(currency)).toStrictEqual(expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/));
      });

      it("should provide a hash not dependent on reference", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce((currency): TokenCurrency[] => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens",
            );
            return listTokensForCryptoCurrency(currency).map((t: TokenCurrency) => ({ ...t }));
          });
        expect(getSyncHash(currency)).toEqual(getSyncHash(currency));
      });

      it("should provide a new hash if a token is removed", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce(currency => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens",
            );
            const list: TokenCurrency[] = listTokensForCryptoCurrency(currency);
            return list.slice(0, list.length - 2);
          });
        expect(getSyncHash(currency)).not.toEqual(getSyncHash(currency));
      });

      it("should provide a new hash if a token is modified", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce(currency => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens",
            );
            const [first, ...rest]: TokenCurrency[] = listTokensForCryptoCurrency(currency);
            const modifedFirst = { ...first, delisted: !first.delisted };
            return [modifedFirst, ...rest];
          });

        expect(getSyncHash(currency)).not.toEqual(getSyncHash(currency));
      });

      it("should provide a new hash if a token is added", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce(currency => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens",
            );
            return [
              ...listTokensForCryptoCurrency(currency),
              {
                type: "TokenCurrency",
                id: "test",
                ledgerSignature: "string",
                contractAddress: "0x123",
                parentCurrency: currency,
                tokenType: "erc20",
              } as TokenCurrency,
            ];
          });
        expect(getSyncHash(currency)).not.toEqual(getSyncHash(currency));
      });

      it("should provide a new hash if nft support is activated or not", () => {
        setEnv("NFT_CURRENCIES", "");
        const hash1 = getSyncHash(currency);
        setEnv("NFT_CURRENCIES", currency.id);
        const hash2 = getSyncHash(currency);

        expect(hash1).not.toEqual(hash2);
      });
    });

    describe("attachOperations", () => {
      it("should attach token & nft operations to coin operations and create 'NONE' coin operations in case of orphans child operations", () => {
        const coinOperation = makeOperation({
          hash: "0xCoinOp3Hash",
        });
        const tokenOperations = [
          makeOperation({
            hash: coinOperation.hash,
            contract: "0xTokenContract",
            value: new BigNumber(1),
            type: "OUT",
          }),
          makeOperation({
            hash: coinOperation.hash,
            contract: "0xTokenContract",
            value: new BigNumber(2),
            type: "IN",
          }),
          makeOperation({
            hash: "0xUnknownHash",
            contract: "0xOtherTokenContract",
            value: new BigNumber(2),
            type: "IN",
          }),
        ];
        const nftOperations = [
          makeNftOperation({
            hash: coinOperation.hash,
            contract: "0xTokenContract",
            value: new BigNumber(1),
            type: "NFT_OUT",
          }),
          makeNftOperation({
            hash: coinOperation.hash,
            contract: "0xTokenContract",
            value: new BigNumber(2),
            type: "NFT_IN",
          }),
          makeNftOperation({
            hash: "0xUnknownNftHash",
            contract: "0xOtherNftTokenContract",
            value: new BigNumber(2),
            type: "NFT_IN",
          }),
        ];

        expect(attachOperations([coinOperation], tokenOperations, nftOperations)).toEqual([
          {
            ...coinOperation,
            subOperations: [tokenOperations[0], tokenOperations[1]],
            nftOperations: [nftOperations[0], nftOperations[1]],
          },
          {
            ...tokenOperations[2],
            id: `js:2:ethereum:0xkvn:-${tokenOperations[2].hash}-NONE`,
            type: "NONE",
            value: new BigNumber(0),
            fee: new BigNumber(0),
            senders: [],
            recipients: [],
            nftOperations: [],
            subOperations: [tokenOperations[2]],
            accountId: "",
            contract: undefined,
          },
          {
            ...nftOperations[2],
            id: `js:2:ethereum:0xkvn:-${nftOperations[2].hash}-NONE`,
            type: "NONE",
            value: new BigNumber(0),
            fee: new BigNumber(0),
            senders: [],
            recipients: [],
            nftOperations: [nftOperations[2]],
            subOperations: [],
            accountId: "",
            contract: undefined,
          },
        ]);
      });

      it("should not mutate the original operations", () => {
        const coinOperations = deepFreeze([
          makeOperation({
            hash: "0xCoinOp3Hash",
          }),
        ]);
        const tokenOperations = deepFreeze([
          makeOperation({
            hash: coinOperations[0].hash,
            contract: "0xTokenContract",
            value: new BigNumber(1),
            type: "OUT",
          }),
        ]);
        const nftOperations = deepFreeze([
          makeNftOperation({
            hash: coinOperations[0].hash,
            contract: "0xTokenContract",
            value: new BigNumber(1),
            type: "NFT_OUT",
          }),
        ]);
        expect(
          // @ts-expect-error purposely ignore readonly ts issue for this
          () => attachOperations(coinOperations, tokenOperations, nftOperations),
        ).not.toThrow(); // mutation prevented by deepFreeze method
      });
    });
  });
});
