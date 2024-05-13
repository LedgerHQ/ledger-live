import { Account, Operation, SubAccount } from "@ledgerhq/types-live";
import { areAllOperationsLoaded } from "./helpers";

const mockAccount = {} as Account;

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
});
