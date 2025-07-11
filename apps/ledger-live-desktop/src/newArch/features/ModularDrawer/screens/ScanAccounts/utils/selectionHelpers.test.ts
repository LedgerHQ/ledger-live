import { Account } from "@ledgerhq/types-live";
import { deselectImportable, getToggledIds, selectImportable } from "./selectionHelpers";

describe("getToggledIds", () => {
  it("should toggle the account ID in the selected IDs", () => {
    const selectedIds = ["1", "2"];
    const accountId = "2";
    const result = getToggledIds(selectedIds, accountId);
    expect(result).toEqual(["1"]);
  });

  it("should add the account ID if it's not already selected", () => {
    const selectedIds = ["1"];
    const accountId = "2";
    const result = getToggledIds(selectedIds, accountId);
    expect(result).toEqual(["1", "2"]);
  });
});

describe("selectImportable", () => {
  it("should select all importable accounts", () => {
    const selected = ["1"];
    const importable = [{ id: "2" }, { id: "3" }] as Account[];
    const result = selectImportable(selected, importable);
    expect(result).toEqual(["1", "2", "3"]);
  });

  it("should not duplicate already selected accounts", () => {
    const selected = ["1", "2"];
    const importable = [{ id: "2" }, { id: "3" }] as Account[];
    const result = selectImportable(selected, importable);
    expect(result).toEqual(["1", "2", "3"]);
  });
});

describe("deselectImportable", () => {
  it("should deselect all importable accounts", () => {
    const selected = ["1", "2", "3"];
    const importable = [{ id: "2" }, { id: "3" }] as Account[];
    const result = deselectImportable(selected, importable);
    expect(result).toEqual(["1"]);
  });

  it("should not remove accounts that are not in importable", () => {
    const selected = ["1", "2"];
    const importable = [{ id: "3" }] as Account[];
    const result = deselectImportable(selected, importable);
    expect(result).toEqual(["1", "2"]);
  });
});
