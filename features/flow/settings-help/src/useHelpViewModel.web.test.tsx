import React from "react";
import { act, renderHook } from "@testing-library/react";
import { createFakeHelpPort, createFakeMobileHelpPort } from "./__tests__/fakeHelpPort";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { useHelpViewModel } from "./useHelpViewModel";

const { LinkingWrapper } = createFakeLinking();

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <I18nWrapper>
      <LinkingWrapper>{children}</LinkingWrapper>
    </I18nWrapper>
  );
}

function renderViewModel() {
  return renderHook(() => useHelpViewModel(createFakeHelpPort()), { wrapper: Wrapper });
}

function pressResetRow(result: ReturnType<typeof renderViewModel>["result"]) {
  const rows = result.current.groups.flatMap(group => group.rows);
  act(() => rows.find(row => row.id === "resetApp")?.onPress?.());
}

describe("useHelpViewModel confirmation", () => {
  it("opens with the wording of the pressed row", () => {
    const { result } = renderViewModel();

    pressResetRow(result);

    expect(result.current.confirmation.isOpen).toBe(true);
    expect(result.current.confirmation.labels.title).toBe("Reset Ledger Wallet");
  });

  it("keeps the wording of the pressed row after a cancel, so the closing dialog does not change", () => {
    const { result } = renderViewModel();
    pressResetRow(result);

    act(() => result.current.confirmation.onCancel());

    expect(result.current.confirmation.isOpen).toBe(false);
    expect(result.current.confirmation.labels.title).toBe("Reset Ledger Wallet");
  });
});

describe("useHelpViewModel with a mobile port", () => {
  it("lists the mobile rows and asks to clear the cache as an information", () => {
    const { result } = renderHook(() => useHelpViewModel(createFakeMobileHelpPort()), {
      wrapper: Wrapper,
    });
    const rows = result.current.groups.flatMap(group => group.rows);

    act(() => rows.find(row => row.id === "clearCache")?.onPress?.());

    expect(rows.map(row => row.id)).toEqual([
      "support",
      "academy",
      "saveLogs",
      "status",
      "clearCache",
    ]);
    expect(result.current.screen).toEqual({ category: "My Wallet", name: "Help" });
    expect(result.current.confirmation.tone).toBe("neutral");
    expect(result.current.confirmationScreenName).toBeNull();
  });
});
