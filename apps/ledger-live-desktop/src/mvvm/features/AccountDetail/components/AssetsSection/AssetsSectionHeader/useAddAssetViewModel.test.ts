import type { Account } from "@ledgerhq/types-live";
import { renderHook } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { useAddAssetViewModel } from "./useAddAssetViewModel";

jest.mock("~/renderer/families", () => ({ useLLDCoinFamily: jest.fn() }));
const mockUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

const xrpAccount = { currency: { family: "xrp" } } as Account;
const stellarAccount = { currency: { family: "stellar", tokenTypes: ["stellar"] } } as Account;

const isVisible = (account: Account) =>
  renderHook(() => useAddAssetViewModel(account)).result.current.isVisible;

describe("useAddAssetViewModel", () => {
  it("shows the action when the currency has static token types", () => {
    mockUseLLDCoinFamily.mockReturnValue({ addAssetAction: jest.fn() });

    expect(isVisible(stellarAccount)).toBe(true);
  });

  it("shows the action when the family returns token types", () => {
    mockUseLLDCoinFamily.mockReturnValue({
      addAssetAction: jest.fn(),
      getTokenTypes: () => ["iou"],
    });

    expect(isVisible(xrpAccount)).toBe(true);
  });

  it("hides the action when the family returns no token types", () => {
    mockUseLLDCoinFamily.mockReturnValue({ addAssetAction: jest.fn(), getTokenTypes: () => [] });

    expect(isVisible(xrpAccount)).toBe(false);
  });

  it("hides it for a family without action", () => {
    mockUseLLDCoinFamily.mockReturnValue({});

    expect(isVisible(stellarAccount)).toBe(false);
  });
});
