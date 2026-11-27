import { renderHook } from "@testing-library/react";
import { I18nWrapper } from "../__tests__/i18nWrapper";
import { useAssetManagementLabels } from "./useAssetManagementLabels";

const renderLabels = () =>
  renderHook(() => useAssetManagementLabels(), { wrapper: I18nWrapper }).result.current;

describe("useAssetManagementLabels", () => {
  it("gives the wording of every row", () => {
    const labels = renderLabels();

    expect(labels.hideEmptyTokenAccounts).toEqual({
      title: "Hide empty token accounts",
      description: "Hide token accounts with zero balance.",
    });
    expect(labels.filterTokenOperationsZeroAmount.title).toBe(
      "Hide token transactions when value is 0",
    );
    expect(labels.hiddenTokens).toMatchObject({ title: "Hidden tokens", manage: "Manage" });
  });

  it("names the token in the action that shows it again", () => {
    expect(renderLabels().hiddenTokens.showToken("Tether USD")).toBe("Show Tether USD");
  });
});
