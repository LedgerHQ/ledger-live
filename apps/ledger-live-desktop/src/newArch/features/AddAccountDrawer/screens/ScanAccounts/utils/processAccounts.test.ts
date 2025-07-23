import { Account } from "@ledgerhq/types-live";
import { determineSelectedIds, getUnimportedAccounts } from "./processAccounts";
import BigNumber from "bignumber.js";

describe("getUnimportedAccounts", () => {
  it("should return accounts that are not in the existing accounts", () => {
    const scannedAccounts = [{ id: "1" }, { id: "2" }] as Account[];
    const existingAccounts = [{ id: "1" }] as Account[];

    const result = getUnimportedAccounts(scannedAccounts, existingAccounts);
    expect(result).toEqual([{ id: "2" }]);
  });

  it("should return an empty array if all scanned accounts exist", () => {
    const scannedAccounts = [{ id: "1" }] as Account[];
    const existingAccounts = [{ id: "1" }] as Account[];

    const result = getUnimportedAccounts(scannedAccounts, existingAccounts);
    expect(result).toEqual([]);
  });

  it("should return accounts that are not duplicates", () => {
    const scannedAccounts = [{ id: "1" }, { id: "2" }, { id: "1" }] as Account[];

    const result = getUnimportedAccounts(scannedAccounts, []);
    expect(result).toEqual([{ id: "1" }, { id: "2" }]);
  });
});

describe("determineSelectedIds", () => {
  it("should return all accounts if onlyNewAccounts is true", () => {
    const accounts = [{ id: "1" }, { id: "2" }] as Account[];
    const result = determineSelectedIds(accounts, true, []);
    expect(result).toEqual(["1", "2"]);
  });

  it("should return current selected ids plus the latest account if not empty", () => {
    const accounts = [
      { id: "1" },
      { id: "2", balance: BigNumber("100"), operationsCount: 1 },
    ] as Account[];
    const result = determineSelectedIds(accounts, false, ["1"]);
    expect(result).toEqual(["1", "2"]);
  });

  it("should return current selected ids if latest account is empty", () => {
    const accounts = [
      { id: "1" },
      { id: "2", balance: BigNumber("0"), operationsCount: 0 },
    ] as Account[];
    const result = determineSelectedIds(accounts, false, ["1"]);
    expect(result).toEqual(["1"]);
  });

  it("should exclude empty accounts from the selection", () => {
    const accounts = [
      { id: "1", balance: BigNumber("0"), operationsCount: 0 },
      { id: "2", balance: BigNumber("100"), operationsCount: 1 },
    ] as Account[];
    const result = determineSelectedIds(accounts, false, []);
    expect(result).toEqual(["2"]);
  });
});

describe("getGroupedAccounts", () => {
  // TODO
});
