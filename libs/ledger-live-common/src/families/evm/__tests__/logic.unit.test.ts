import BigNumber from "bignumber.js";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import * as cryptoAssetsTokens from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../types";
import { makeAccount, makeOperation, makeTokenAccount } from "../testUtils";
import {
  eip1559TransactionHasFees,
  getEstimatedFees,
  getSyncHash,
  legacyTransactionHasFees,
  mergeSubAccounts,
} from "../logic";

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
          type: 0,
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
        const tx: Partial<EvmTransactionLegacy | EvmTransactionEIP1559> = {
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

    describe("mergeSubAccounts", () => {
      it("should merge 2 different sub accounts", () => {
        const tokenAccount1 = {
          ...makeTokenAccount(
            "0xkvn",
            getTokenById("ethereum/erc20/usd__coin")
          ),
          balance: new BigNumber(1),
          operations: [],
        };
        const tokenAccount2 = {
          ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/weth")),
          balance: new BigNumber(2),
          operations: [],
        };
        const account = makeAccount(
          "0xkvn",
          getCryptoCurrencyById("ethereum"),
          [tokenAccount1]
        );

        const newSubAccounts = mergeSubAccounts(account, [tokenAccount2]);
        expect(newSubAccounts).toEqual([tokenAccount1, tokenAccount2]);
        expect(newSubAccounts).not.toBe(account.subAccounts); // shouldn't mutate original account
        expect(account.subAccounts).toEqual([tokenAccount1]); // shouldn't mutate original account
        expect(newSubAccounts[0]).toBe(account.subAccounts?.[0]); // keeping the reference though
      });

      it("should merge 2 different sub accounts and update the first one", () => {
        const tokenAccount1 = {
          ...makeTokenAccount(
            "0xkvn",
            getTokenById("ethereum/erc20/usd__coin")
          ),
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
        const account = makeAccount(
          "0xkvn",
          getCryptoCurrencyById("ethereum"),
          [tokenAccount1]
        );

        const newSubAccounts = mergeSubAccounts(account, [
          tokenAccount1Bis,
          tokenAccount2,
        ]);
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
          ...makeTokenAccount(
            "0xkvn",
            getTokenById("ethereum/erc20/usd__coin")
          ),
          balance: new BigNumber(1),
          operations: [op1, op2],
          operationsCount: 2,
        };
        const tokenAccount1Bis = {
          ...tokenAccount1,
          operations: [op3, op1, op2],
          operationsCount: 3,
        };
        const account = makeAccount(
          "0xkvn",
          getCryptoCurrencyById("ethereum"),
          [tokenAccount1]
        );

        const newSubAccounts = mergeSubAccounts(account, [tokenAccount1Bis]);
        expect(newSubAccounts).not.toBe(account.subAccounts); // shouldn't mutate original account
        expect(account.subAccounts).toEqual([tokenAccount1]); // shouldn't mutate original account
        expect(newSubAccounts[0]).not.toBe(account.subAccounts?.[0]); // changing the ref as change happened
        expect(newSubAccounts[0]?.operations?.[1]).toBe(
          account.subAccounts?.[0]?.operations?.[0]
        ); // keeping the reference for the ops though
        expect(newSubAccounts[0]?.operations?.[2]).toBe(
          account.subAccounts?.[0]?.operations?.[1]
        ); // keeping the reference for the ops though
        expect(newSubAccounts).toEqual([tokenAccount1Bis]);
      });

      it("should return only new sub accounts", () => {
        const tokenAccount = {
          ...makeTokenAccount(
            "0xkvn",
            getTokenById("ethereum/erc20/usd__coin")
          ),
          balance: new BigNumber(1),
        };
        const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"));
        delete account.subAccounts;

        const newSubAccounts = mergeSubAccounts(account, [tokenAccount]);
        expect(newSubAccounts).toEqual([tokenAccount]);
        expect(account.subAccounts).toBe(undefined); // shouldn't mutate original account
      });

      it("should dedup sub accounts", () => {
        const tokenAccount = {
          ...makeTokenAccount(
            "0xkvn",
            getTokenById("ethereum/erc20/usd__coin")
          ),
          balance: new BigNumber(1),
        };
        const account = makeAccount(
          "0xkvn",
          getCryptoCurrencyById("ethereum"),
          [tokenAccount]
        );

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

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should provide a valid sha256 hash", () => {
        expect(getSyncHash(currency)).toStrictEqual(
          expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/)
        );
      });

      it("should provide a hash not dependent on reference", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce((currency) => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens"
            );
            return listTokensForCryptoCurrency(currency).map((t) => ({ ...t }));
          });
        expect(getSyncHash(currency)).toEqual(getSyncHash(currency));
      });

      it("should provide a new hash if a token is removed", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce((currency) => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens"
            );
            const list: TokenCurrency[] = listTokensForCryptoCurrency(currency);
            return list.slice(0, list.length - 2);
          });
        expect(getSyncHash(currency)).not.toEqual(getSyncHash(currency));
      });

      it("should provide a new hash if a token is modified", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce((currency) => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens"
            );
            const [first, ...rest]: TokenCurrency[] =
              listTokensForCryptoCurrency(currency);
            const modifedFirst = { ...first, delisted: !first.delisted };
            return [modifedFirst, ...rest];
          });

        expect(getSyncHash(currency)).not.toEqual(getSyncHash(currency));
      });

      it("should provide a new hash if a token is added", () => {
        jest
          .spyOn(cryptoAssetsTokens, "listTokensForCryptoCurrency")
          .mockImplementationOnce((currency) => {
            const { listTokensForCryptoCurrency } = jest.requireActual(
              "@ledgerhq/cryptoassets/tokens"
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
    });
  });
});
