import { act, renderHook } from "@testing-library/react";
import { makeSettingsWrapper } from "./__tests__/settingsWrapper";
import { createFakeGeneralPort } from "./__tests__/fakeGeneralPort";
import { useGeneralSectionViewModel } from "./useGeneralSectionViewModel";

function renderViewModel(...args: Parameters<typeof createFakeGeneralPort>) {
  const fake = createFakeGeneralPort(...args);
  const hook = renderHook(() => useGeneralSectionViewModel(), {
    wrapper: makeSettingsWrapper(fake.port),
  });
  return { ...hook, ...fake };
}

describe("useGeneralSectionViewModel", () => {
  it("shows the current values of the port", () => {
    const { result } = renderViewModel({
      theme: "dark",
      language: "fr",
      currency: "EUR",
    });

    expect(result.current.theme.value).toBe("dark");
    expect(result.current.language.value).toBe("fr");
    expect(result.current.currency.value).toBe("EUR");
  });

  it("offers the three themes and stores the picked one", () => {
    const { result, updates } = renderViewModel();

    expect(result.current.theme.options.map(option => option.label)).toEqual([
      "System",
      "Light",
      "Dark",
    ]);
    act(() => result.current.theme.onSelect("light"));
    act(() => result.current.theme.onSelect("sepia"));

    expect(updates).toEqual([{ key: "theme", value: "light" }]);
  });

  it("offers the languages of the app and stores the picked one", () => {
    const { result, updates } = renderViewModel();

    expect(result.current.language.options).toContainEqual({ value: "fr", label: "Français" });
    act(() => result.current.language.onSelect("fr"));

    expect(updates).toEqual([{ key: "language", value: "fr" }]);
  });

  it("shows the ticker of the currency once picked, and stores the picked one", () => {
    const { result, updates } = renderViewModel(undefined, {
      currencies: [{ value: "EUR", label: "Euro", description: "EUR" }],
    });

    expect(result.current.currency.options).toEqual([
      { value: "EUR", label: "Euro", description: "EUR", shortLabel: "EUR" },
    ]);
    act(() => result.current.currency.onSelect("EUR"));

    expect(updates).toEqual([{ key: "currency", value: "EUR" }]);
  });

  it("offers to sync while Ledger Sync is off, to manage it once on, and opens it", () => {
    const off = renderViewModel();
    expect(off.result.current.ledgerSync.actionLabel).toBe("Sync");
    off.result.current.ledgerSync.onOpen();
    expect(off.ledgerSyncOpenings.count).toBe(1);

    const on = renderViewModel(undefined, { isLedgerSyncActive: true });
    expect(on.result.current.ledgerSync.actionLabel).toBe("Manage");
  });
});
