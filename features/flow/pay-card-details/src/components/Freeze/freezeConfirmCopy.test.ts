import { freezeConfirmActionKey, freezeConfirmTitleKey } from "./freezeConfirmCopy";

describe("freezeConfirmCopy", () => {
  it("returns freeze keys while the card is active", () => {
    expect(freezeConfirmTitleKey(false)).toBe("payTab.card.freezeConfirm.title");
    expect(freezeConfirmActionKey(false)).toBe("payTab.card.freezeConfirm.confirm");
  });

  it("returns unfreeze keys while the card is frozen", () => {
    expect(freezeConfirmTitleKey(true)).toBe("payTab.card.unfreezeConfirm.title");
    expect(freezeConfirmActionKey(true)).toBe("payTab.card.unfreezeConfirm.confirm");
  });
});
