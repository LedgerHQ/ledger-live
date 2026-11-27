import { getApolloHiddenSettings } from "./apolloHiddenSettings";

const BOTH_ROWS = ["myLedgerProvider", "mockAppUpdate"];

describe("getApolloHiddenSettings", () => {
  it.each([
    { enabled: true, params: { hideMyLedgerProvider: false, hideMockAppUpdate: false } },
    { enabled: false, params: { hideMyLedgerProvider: false, hideMockAppUpdate: false } },
    { enabled: true },
    null,
    undefined,
  ])("hides both rows on Apollo, whatever the flag (%p)", flag => {
    expect(getApolloHiddenSettings({ isApollo: true, flag })).toEqual(BOTH_ROWS);
  });

  it("hides off Apollo the rows whose param is true while the flag is on", () => {
    expect(
      getApolloHiddenSettings({
        isApollo: false,
        flag: { enabled: true, params: { hideMyLedgerProvider: true } },
      }),
    ).toEqual(["myLedgerProvider"]);
    expect(
      getApolloHiddenSettings({
        isApollo: false,
        flag: { enabled: true, params: { hideMockAppUpdate: true } },
      }),
    ).toEqual(["mockAppUpdate"]);
    expect(
      getApolloHiddenSettings({
        isApollo: false,
        flag: { enabled: true, params: { hideMyLedgerProvider: true, hideMockAppUpdate: true } },
      }),
    ).toEqual(BOTH_ROWS);
  });

  it("ignores the params off Apollo while the flag is off", () => {
    expect(
      getApolloHiddenSettings({
        isApollo: false,
        flag: { enabled: false, params: { hideMyLedgerProvider: true, hideMockAppUpdate: true } },
      }),
    ).toEqual([]);
  });

  it("hides nothing off Apollo while the params are false or missing", () => {
    expect(
      getApolloHiddenSettings({
        isApollo: false,
        flag: { enabled: true, params: { hideMyLedgerProvider: false, hideMockAppUpdate: false } },
      }),
    ).toEqual([]);
    expect(getApolloHiddenSettings({ isApollo: false, flag: { enabled: true } })).toEqual([]);
    expect(getApolloHiddenSettings({ isApollo: false, flag: null })).toEqual([]);
  });
});
