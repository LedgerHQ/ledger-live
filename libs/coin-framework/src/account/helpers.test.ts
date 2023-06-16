import {
  CryptoCurrency,
  TokenCurrency,
  Unit,
} from "@ledgerhq/types-cryptoassets";
import {
  Account,
  ChildAccount,
  Operation,
  SubAccount,
  TokenAccount,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  areAllOperationsLoaded,
  emptyHistoryCache,
  getAccountCurrency,
  getAccountName,
  getAccountSpendableBalance,
  getAccountUnit,
  getFeesCurrency,
} from ".";
import {
  isAccountEmpty,
  isAccountBalanceSignificant,
  clearAccount,
} from "./helpers";

const mockAccount = {} as Account;
const childAccount = {
  ...mockAccount,
  type: "ChildAccount",
  parentId: "sampleId",
  address: "sampleAddress",
} as ChildAccount;
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

  describe("given a ChildAccount", () => {
    it("should return the currency", () => {
      const sampleCurrency = { family: "bitcoin" } as CryptoCurrency;
      childAccount.currency = sampleCurrency;
      expect(getAccountCurrency(childAccount)).toEqual(sampleCurrency);
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token currency", () => {
      const sampleToken = { id: "tokenId" } as TokenCurrency;
      tokenAccount.token = sampleToken;
      expect(getAccountCurrency(tokenAccount)).toEqual(sampleToken);
    });
  });

  describe("given an unknown type Account", () => {
    beforeEach(() => {
      (mockAccount as any).type = "DefinitelyNotAStandardAccount";
    });

    it("should throw an error", () => {
      expect(() => getAccountCurrency(mockAccount)).toThrow(Error);
    });

    it("should display the account type in the error message", () => {
      expect.assertions(1);
      try {
        getAccountCurrency(mockAccount);
      } catch (e: unknown) {
        expect((e as Error).message.includes(mockAccount.type)).toEqual(true);
      }
    });
  });
});

describe(getAccountUnit.name, () => {
  describe("given an Account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
    });
    it("should return the unit", () => {
      const sampleUnit = { name: "unit" } as Unit;
      mockAccount.unit = sampleUnit;
      expect(getAccountUnit(mockAccount)).toEqual(sampleUnit);
    });
  });

  describe("given a ChildAccount", () => {
    it("should return the currency unit", () => {
      const sampleUnit = { name: "unit" } as Unit;
      childAccount.currency = { units: [sampleUnit] } as CryptoCurrency;
      expect(getAccountUnit(childAccount)).toEqual(sampleUnit);
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token unit", () => {
      const sampleUnit = { name: "unit" } as Unit;
      tokenAccount.token = { units: [sampleUnit] } as TokenCurrency;
      expect(getAccountUnit(tokenAccount)).toEqual(sampleUnit);
    });
  });

  describe("given an unknown type Account", () => {
    beforeEach(() => {
      (mockAccount as any).type = "DefinitelyNotAStandardAccount";
    });

    it("should throw an error", () => {
      expect(() => getAccountUnit(mockAccount)).toThrow(Error);
    });

    it("should display the account type in the error message", () => {
      expect.assertions(1);
      try {
        getAccountUnit(mockAccount);
      } catch (e: unknown) {
        expect((e as Error).message.includes(mockAccount.type)).toEqual(true);
      }
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

  describe("given a ChildAccount", () => {
    it("should return the currency", () => {
      const sampleCurrency = { family: "bitcoin" } as CryptoCurrency;
      childAccount.currency = sampleCurrency;
      expect(getFeesCurrency(childAccount)).toEqual(sampleCurrency);
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

describe(getAccountName.name, () => {
  describe("given an Account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
    });
    it("should return the account name", () => {
      const sampleAccountName = "SampleAccountName";
      mockAccount.name = sampleAccountName;
      expect(getAccountName(mockAccount)).toEqual(sampleAccountName);
    });
  });

  describe("given a ChildAccount", () => {
    it("should return the account name", () => {
      const sampleAccountName = "SampleAccountName";
      childAccount.name = sampleAccountName;
      expect(getAccountName(childAccount)).toEqual(sampleAccountName);
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token account name", () => {
      const sampleAccountName = "SampleAccountName";
      tokenAccount.token = { name: sampleAccountName } as TokenCurrency;
      expect(getAccountName(tokenAccount)).toEqual(sampleAccountName);
    });
  });

  describe("given an unknown type Account", () => {
    beforeEach(() => {
      (mockAccount as any).type = "DefinitelyNotAStandardAccount";
    });

    it("should throw an error", () => {
      expect(() => getAccountName(mockAccount)).toThrow(Error);
    });

    it("should display the account type in the error message", () => {
      expect.assertions(1);
      try {
        getAccountName(mockAccount);
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
      expect(getAccountSpendableBalance(mockAccount)).toEqual(
        sampleAccountBalance
      );
    });
  });

  describe("given a ChildAccount", () => {
    it("should return the account balance", () => {
      const sampleAccountBalance = new BigNumber(10);
      childAccount.balance = sampleAccountBalance;
      expect(getAccountSpendableBalance(childAccount)).toEqual(
        sampleAccountBalance
      );
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token account spendable balance", () => {
      const sampleAccountBalance = new BigNumber(10);
      tokenAccount.spendableBalance = sampleAccountBalance;
      expect(getAccountSpendableBalance(tokenAccount)).toEqual(
        sampleAccountBalance
      );
    });
  });

  describe("given an unknown type Account", () => {
    beforeEach(() => {
      (mockAccount as any).type = "DefinitelyNotAStandardAccount";
    });

    it("should throw an error", () => {
      expect(() => getAccountSpendableBalance(mockAccount)).toThrow(Error);
    });

    it("should display the account type in the error message", () => {
      expect.assertions(1);
      try {
        getAccountSpendableBalance(mockAccount);
      } catch (e: unknown) {
        expect((e as Error).message.includes(mockAccount.type)).toEqual(true);
      }
    });
  });
});

describe(isAccountEmpty.name, () => {
  describe("given an account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
      mockAccount.currency = { family: "ethereum" } as CryptoCurrency;
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
        mockAccount.subAccounts = [{} as SubAccount];
      });

      it("should return false", () => {
        expect(isAccountEmpty(mockAccount)).toEqual(false);
      });
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
      ] as SubAccount[];
    });
    describe("when sub account operation aren't loaded", () => {
      beforeEach(() => {
        (mockAccount.subAccounts as SubAccount[])[1].operations = [];
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
  describe("given an account without subAccounts", () => {
    describe("when operations count is different from operations length", () => {
      beforeEach(() => {
        childAccount.operationsCount = 2;
        childAccount.operations = [{} as Operation];
      });
      it("should return false", () => {
        expect(areAllOperationsLoaded(childAccount)).toEqual(false);
      });
    });

    describe("when operations count is same as operations length", () => {
      beforeEach(() => {
        childAccount.operationsCount = 1;
        childAccount.operations = [{} as Operation];
      });
      it("should return true", () => {
        expect(areAllOperationsLoaded(childAccount)).toEqual(true);
      });
    });
  });
});

describe(isAccountBalanceSignificant.name, () => {
  describe("when balance is low", () => {
    beforeEach(() => {
      mockAccount.balance = new BigNumber(10);
    });
    it("should return false", () => {
      expect(isAccountBalanceSignificant(mockAccount)).toEqual(false);
    });
  });
  describe("when balance is high", () => {
    beforeEach(() => {
      mockAccount.balance = new BigNumber(101);
    });
    it("should return true", () => {
      expect(isAccountBalanceSignificant(mockAccount)).toEqual(true);
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

  describe("given a ChildAccount", () => {
    const childAccount = {
      ...mockAccount,
      type: "ChildAccount",
      parentId: "sampleId",
      address: "sampleAddress",
    } as ChildAccount;

    it("should clear operations", () => {
      const clearedAccount = clearAccount(childAccount);
      expect(clearedAccount.operations.length).toEqual(0);
      expect(clearedAccount.pendingOperations.length).toEqual(0);
    });

    it("should clear balanceHistory", () => {
      const clearedAccount = clearAccount(childAccount);
      expect(clearedAccount.balanceHistoryCache).toEqual(emptyHistoryCache);
    });
  });

  describe("given an Account", () => {
    const ethereumCurrency = {
      family: "ethereum",
    } as CryptoCurrency;
    const withSubAccounts = {
      ...mockAccount,
      subAccounts: [
        {
          currency: ethereumCurrency,
        } as SubAccount,
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
