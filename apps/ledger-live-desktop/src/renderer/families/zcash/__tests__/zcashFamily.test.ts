import bitcoinFamily from "../../bitcoin";
import zcashFamily from "..";

const ZCASH_SLOTS = [
  "useCustomConfirmAddress",
  "SendRecipientNotice",
  "AccountBalanceSummaryFooter",
  "operationDetails",
  "PostBroadcastEffect",
  "SendAmountEffect",
] as const;

describe("family slots", () => {
  it.each(ZCASH_SLOTS)("the bitcoin family does not expose %s", slot => {
    expect(bitcoinFamily[slot]).toBeUndefined();
  });

  it.each(ZCASH_SLOTS)("the zcash family exposes %s", slot => {
    expect(zcashFamily[slot]).toBeDefined();
  });

  it("the bitcoin family does not preload the zcash export key modal", () => {
    expect(bitcoinFamily.modalsToPreload).not.toContain("MODAL_ZCASH_EXPORT_KEY");
  });

  it("the zcash family preloads the zcash export key modal", () => {
    expect(zcashFamily.modalsToPreload).toContain("MODAL_ZCASH_EXPORT_KEY");
  });
});
