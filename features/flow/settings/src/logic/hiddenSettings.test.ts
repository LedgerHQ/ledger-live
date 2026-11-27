import { SETTING_IDS, getHiddenSettings, isSettingId } from "./hiddenSettings";

describe("getHiddenSettings", () => {
  it("hides nothing when the list is empty", () => {
    expect(getHiddenSettings([]).size).toBe(0);
  });

  it("hides every known setting it receives", () => {
    expect([...getHiddenSettings(["myLedgerProvider", "mockAppUpdate"])]).toEqual([
      "myLedgerProvider",
      "mockAppUpdate",
    ]);
  });

  it("ignores unknown ids", () => {
    expect([...getHiddenSettings(["myLedgerProvider", "notASetting"])]).toEqual([
      "myLedgerProvider",
    ]);
  });

  it.each([undefined, null, "myLedgerProvider", 42, { myLedgerProvider: true }])(
    "hides nothing when the input is not a list (%p)",
    rowsToHide => {
      expect(getHiddenSettings(rowsToHide).size).toBe(0);
    },
  );

  it("keeps only the known ids of a mixed list", () => {
    expect([...getHiddenSettings([null, 1, "mockAppUpdate", {}, "MockAppUpdate"])]).toEqual([
      "mockAppUpdate",
    ]);
  });

  it("lists each hidden setting once", () => {
    expect([...getHiddenSettings(["mockAppUpdate", "mockAppUpdate"])]).toEqual(["mockAppUpdate"]);
  });
});

describe("isSettingId", () => {
  it.each(SETTING_IDS)("accepts the known id %s", id => {
    expect(isSettingId(id)).toBe(true);
  });

  it.each(["", "settings", "MyLedgerProvider", 0, null, undefined])("rejects %p", value => {
    expect(isSettingId(value)).toBe(false);
  });
});
