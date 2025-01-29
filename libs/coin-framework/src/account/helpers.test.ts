import BigNumber from "bignumber.js";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import {
  emptyHistoryCache,
  getAccountCurrency,
  getAccountSpendableBalance,
  getFeesCurrency,
} from ".";
import { isAccountEmpty, clearAccount, areAllOperationsLoaded } from "./helpers";

const mockAccount = {} as Account;
const tokenAccount = {
  ...mockAccount,
  type: "TokenAccount",
  token: {} as TokenCurrency,
  parentId: "sampleId",
} as TokenAccount;

describe(getAccountCurrency.name, () => {
  describe("given an Account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
    });
    it("should return the currency", () => {
      const sampleCurrency = { family: "bitcoin" } as CryptoCurrency;
      mockAccount.currency = sampleCurrency;
      expect(getAccountCurrency(mockAccount)).toEqual(sampleCurrency);
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token currency", () => {
      const sampleToken = { id: "tokenId" } as TokenCurrency;
      tokenAccount.token = sampleToken;
      expect(getAccountCurrency(tokenAccount)).toEqual(sampleToken);
    });
  });
});

describe(getFeesCurrency.name, () => {
  describe("given an Account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
    });
    describe("without feesCurrency", () => {
      it("should return the account's currency", () => {
        const sampleCurrency = { family: "bitcoin" } as CryptoCurrency;
        mockAccount.currency = sampleCurrency;
        expect(getFeesCurrency(mockAccount)).toEqual(sampleCurrency);
      });
    });
    describe("with feesCurrency", () => {
      it("should return the fees currency", () => {
        const sampleCurrency = { family: "vechain" } as CryptoCurrency;
        const sampleFeesCurrency = { id: "VTHO" } as TokenCurrency;
        mockAccount.currency = sampleCurrency;
        mockAccount.feesCurrency = sampleFeesCurrency;
        expect(getFeesCurrency(mockAccount)).toEqual(sampleFeesCurrency);
      });
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token currency", () => {
      const sampleToken = { id: "tokenId" } as TokenCurrency;
      tokenAccount.token = sampleToken;
      expect(getFeesCurrency(tokenAccount)).toEqual(sampleToken);
    });
  });

  describe("given an unknown type Account", () => {
    beforeEach(() => {
      (mockAccount as any).type = "DefinitelyNotAStandardAccount";
    });

    it("should throw an error", () => {
      expect(() => getFeesCurrency(mockAccount)).toThrow(Error);
    });

    it("should display the account type in the error message", () => {
      expect.assertions(1);
      try {
        getFeesCurrency(mockAccount);
      } catch (e: unknown) {
        expect((e as Error).message.includes(mockAccount.type)).toEqual(true);
      }
    });
  });
});

describe(getAccountSpendableBalance.name, () => {
  describe("given an Account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
    });
    it("should return the account spendable balance", () => {
      const sampleAccountBalance = new BigNumber(10);
      mockAccount.spendableBalance = sampleAccountBalance;
      expect(getAccountSpendableBalance(mockAccount)).toEqual(sampleAccountBalance);
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token account spendable balance", () => {
      const sampleAccountBalance = new BigNumber(10);
      tokenAccount.spendableBalance = sampleAccountBalance;
      expect(getAccountSpendableBalance(tokenAccount)).toEqual(sampleAccountBalance);
    });
  });
});

describe(isAccountEmpty.name, () => {
  describe("given an account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
      mockAccount.currency = { family: "evm" } as CryptoCurrency;
    });
    describe("when account has no subaccounts", () => {
      beforeEach(() => {
        mockAccount.subAccounts = [];
      });

      describe("and balance is zero", () => {
        beforeEach(() => {
          mockAccount.balance = new BigNumber(0);
        });
        it("should return true if operationsCount is 0", () => {
          mockAccount.operationsCount = 0;
          expect(isAccountEmpty(mockAccount)).toEqual(true);
        });
        it("should return false if operationsCount is higher than 0", () => {
          mockAccount.operationsCount = 1;
          expect(isAccountEmpty(mockAccount)).toEqual(false);
        });
      });

      describe("and balance is higher than 0", () => {
        beforeEach(() => {
          mockAccount.balance = new BigNumber(42);
        });
        it("should return false if operationsCount is 0", () => {
          mockAccount.operationsCount = 0;
          expect(isAccountEmpty(mockAccount)).toEqual(false);
        });
        it("should return false if operationsCount is higher than 0", () => {
          mockAccount.operationsCount = 1;
          expect(isAccountEmpty(mockAccount)).toEqual(false);
        });
      });
    });
    describe("when account has subaccounts", () => {
      beforeEach(() => {
        mockAccount.subAccounts = [{} as TokenAccount];
      });

      it("should return false", () => {
        expect(isAccountEmpty(mockAccount)).toEqual(false);
      });
    });
  });
});

describe(clearAccount.name, () => {
  describe("given a TokenAccount", () => {
    const tokenAccount = {
      ...mockAccount,
      token: {} as TokenCurrency,
      parentId: "sampleId",
      type: "TokenAccount",
    } as TokenAccount;

    it("should clear operations", () => {
      const clearedAccount = clearAccount(tokenAccount);
      expect(clearedAccount.operations.length).toEqual(0);
      expect(clearedAccount.pendingOperations.length).toEqual(0);
    });

    it("should clear balanceHistory", () => {
      const clearedAccount = clearAccount(tokenAccount);
      expect(clearedAccount.balanceHistoryCache).toEqual(emptyHistoryCache);
    });
  });

  describe("given an Account", () => {
    const ethereumCurrency = {
      family: "evm",
    } as CryptoCurrency;
    const withSubAccounts = {
      ...mockAccount,
      subAccounts: [
        {
          token: getTokenById("ethereum/erc20/dao_maker"),
        } as TokenAccount,
      ],
      currency: ethereumCurrency,
    };
    it("should clear operations", () => {
      const clearedAccount = clearAccount(withSubAccounts);
      expect(clearedAccount.operations.length).toEqual(0);
      expect(clearedAccount.pendingOperations.length).toEqual(0);
    });

    it("should clear balanceHistory", () => {
      const clearedAccount = clearAccount(withSubAccounts);
      expect(clearedAccount.balanceHistoryCache).toEqual(emptyHistoryCache);
    });

    it("should reset lastSyncDate", () => {
      const clearedAccount = clearAccount(withSubAccounts);
      expect(clearedAccount.lastSyncDate).toEqual(new Date(0));
    });

    it("should delete nfts attribute", () => {
      withSubAccounts.nfts = [];
      const clearedAccount = clearAccount(withSubAccounts);
      expect(Object.keys(clearedAccount).indexOf("nfts")).toEqual(-1);
    });
  });
});

describe(areAllOperationsLoaded.name, () => {
  describe("given an account with subAccounts", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
      mockAccount.operations = [];
      mockAccount.operationsCount = 0;
      mockAccount.subAccounts = [
        {
          operations: [],
          operationsCount: 0,
        },
        {
          operations: [{} as Operation],
          operationsCount: 1,
        },
      ] as TokenAccount[];
    });
    describe("when sub account operation aren't loaded", () => {
      beforeEach(() => {
        (mockAccount.subAccounts as TokenAccount[])[1].operations = [];
      });
      it("should return false", () => {
        expect(areAllOperationsLoaded(mockAccount)).toEqual(false);
      });
    });

    describe("when sub account operation are loaded", () => {
      it("should return true", () => {
        expect(areAllOperationsLoaded(mockAccount)).toEqual(true);
      });
    });
  });
});
