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
  it("defers the Ledger Sync introduction while the feature introduction is requested", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: true,
        ledgerSyncStatus: "inactive",
        isLedgerSyncIntroductionDismissed: false,
      }),
    ).toBe(false);
  });

  it("opens the Ledger Sync introduction once the feature introduction is no longer requested", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: false,
        ledgerSyncStatus: "inactive",
        isLedgerSyncIntroductionDismissed: false,
      }),
    ).toBe(true);
  });

  it("does not open the Ledger Sync introduction while sync status is not inactive", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: false,
        ledgerSyncStatus: "checking",
        isLedgerSyncIntroductionDismissed: false,
      }),
    ).toBe(false);
  });

  it("does not reopen the Ledger Sync introduction after session dismissal", () => {
    expect(
      resolveContactsLedgerSyncIntroductionOpen({
        isFeatureIntroductionRequested: false,
        ledgerSyncStatus: "inactive",
        isLedgerSyncIntroductionDismissed: true,
      }),
    ).toBe(false);
  });
});
