import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  BandwidthInfo,
  TronAccount,
  TronResources,
} from "../families/tron/types";
import { clearAccount, getVotesCount, isAccountEmpty } from "./helpers";

const mockAccount = {} as Account;

describe(isAccountEmpty.name, () => {
  describe("given a Tron account", () => {
    let tronAccount: TronAccount;
    beforeEach(() => {
      tronAccount = mockAccount as TronAccount;
      tronAccount.type = "Account";
      tronAccount.currency = { id: "tron" } as CryptoCurrency;
    });
    describe("when account as no ressources", () => {
      beforeEach(() => {
        tronAccount.tronResources = {
          bandwidth: {
            freeLimit: new BigNumber(0),
          } as BandwidthInfo,
        } as TronResources;
      });

      it("should return true", () => {
        expect(isAccountEmpty(tronAccount)).toEqual(true);
      });
    });
    describe("when account has resources", () => {
      beforeEach(() => {
        tronAccount.tronResources = {
          bandwidth: {
            freeLimit: new BigNumber(42),
          } as BandwidthInfo,
        } as TronResources;
      });

      it("should return false", () => {
        expect(isAccountEmpty(tronAccount)).toEqual(false);
      });
    });
  });

  describe("given an account", () => {
    beforeEach(() => {
      mockAccount.type = "Account";
      mockAccount.currency = { id: "ethereum" } as CryptoCurrency;
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
