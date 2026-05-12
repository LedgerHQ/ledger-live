import { Account } from "@ledgerhq/types-live";
import { getUnimportedAccounts } from "./processAccounts";

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

describe("getGroupedAccounts", () => {
  // TODO
});
