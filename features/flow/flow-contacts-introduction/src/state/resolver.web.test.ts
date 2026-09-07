import {
  resolveContactsFeatureIntroductionRequested,
  resolveContactsLedgerSyncIntroductionOpen,
} from "./resolver";

describe("resolveContactsFeatureIntroductionRequested", () => {
  it("requests the introduction on a first visit when the entry is available", () => {
    expect(
      resolveContactsFeatureIntroductionRequested({
        isContactsEntryAvailable: true,
        isDismissed: false,
      }),
    ).toBe(true);
  });

  it("does not request the introduction after dismissal", () => {
    expect(
      resolveContactsFeatureIntroductionRequested({
        isContactsEntryAvailable: true,
        isDismissed: true,
      }),
    ).toBe(false);
  });

  it("does not request the introduction when the entry is unavailable", () => {
    expect(
      resolveContactsFeatureIntroductionRequested({
        isContactsEntryAvailable: false,
        isDismissed: false,
      }),
    ).toBe(false);
  });
});

describe("resolveContactsLedgerSyncIntroductionOpen", () => {
  it("stays closed until the user requests a mutation that needs Ledger Sync", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: false,
        ledgerSyncStatus: "inactive",
        isLedgerSyncIntroductionRequested: false,
      }),
    ).toBe(false);
  });

  it("defers the Ledger Sync introduction while the feature introduction is requested", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: true,
        ledgerSyncStatus: "inactive",
        isLedgerSyncIntroductionRequested: true,
      }),
    ).toBe(false);
  });

  it("opens the Ledger Sync introduction once the feature introduction is no longer requested", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: false,
        ledgerSyncStatus: "inactive",
        isLedgerSyncIntroductionRequested: true,
      }),
    ).toBe(true);
  });

  it("does not open the Ledger Sync introduction while sync status is not inactive", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: false,
        ledgerSyncStatus: "checking",
        isLedgerSyncIntroductionRequested: true,
      }),
    ).toBe(false);
  });

  it("opens the Ledger Sync introduction while sync is unavailable", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: false,
        ledgerSyncStatus: "unavailable",
        isLedgerSyncIntroductionRequested: true,
      }),
    ).toBe(true);
  });
});
