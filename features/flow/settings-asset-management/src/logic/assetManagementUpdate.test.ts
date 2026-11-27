import type { AssetManagementSideEffects } from "../ports";
import { applyAssetManagementUpdate, isAssetManagementUpdate } from "./assetManagementUpdate";

const createEffects = () =>
  ({
    setHideEmptyTokenAccounts: jest.fn(),
    setFilterTokenOperationsZeroAmount: jest.fn(),
  }) satisfies AssetManagementSideEffects;

describe("applyAssetManagementUpdate", () => {
  it("hides the empty token accounts and nothing else", () => {
    const effects = createEffects();

    applyAssetManagementUpdate(effects, { key: "hideEmptyTokenAccounts", value: true });

    expect(effects.setHideEmptyTokenAccounts.mock.calls).toEqual([[true]]);
    expect(effects.setFilterTokenOperationsZeroAmount).not.toHaveBeenCalled();
  });

  it("filters the token transactions worth 0 and nothing else", () => {
    const effects = createEffects();

    applyAssetManagementUpdate(effects, { key: "filterTokenOperationsZeroAmount", value: false });

    expect(effects.setFilterTokenOperationsZeroAmount.mock.calls).toEqual([[false]]);
    expect(effects.setHideEmptyTokenAccounts).not.toHaveBeenCalled();
  });
});

describe("isAssetManagementUpdate", () => {
  it("recognizes the changes of the Asset management section", () => {
    expect(isAssetManagementUpdate({ key: "hideEmptyTokenAccounts" })).toBe(true);
    expect(isAssetManagementUpdate({ key: "filterTokenOperationsZeroAmount" })).toBe(true);
  });

  it("leaves the changes of the other sections", () => {
    expect(isAssetManagementUpdate({ key: "theme" })).toBe(false);
    expect(isAssetManagementUpdate({ key: "hideBalance" })).toBe(false);
  });
});
