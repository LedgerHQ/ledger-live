import { freezeCopy } from "./freezeCopy";

describe("freezeCopy", () => {
  it("returns freeze keys while the card is active", () => {
    expect(freezeCopy("ACTIVE")).toEqual({
      tile: "payTab.card.freeze",
      title: "payTab.card.freezeConfirm.title",
      action: "payTab.card.freezeConfirm.confirm",
      errorTitle: "payTab.card.freezeConfirm.errorTitle",
    });
  });

  it("returns unfreeze keys while the card is frozen", () => {
    expect(freezeCopy("FROZEN")).toEqual({
      tile: "payTab.card.unfreeze",
      title: "payTab.card.unfreezeConfirm.title",
      action: "payTab.card.unfreezeConfirm.confirm",
      errorTitle: "payTab.card.unfreezeConfirm.errorTitle",
    });
  });

  it.each(["BLOCKED", "INACTIVE", undefined] as const)(
    "returns the freeze keys on a %s card",
    status => {
      expect(freezeCopy(status)).toEqual(freezeCopy("ACTIVE"));
    },
  );
});
