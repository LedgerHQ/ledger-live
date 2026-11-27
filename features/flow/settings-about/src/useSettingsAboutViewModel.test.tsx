import React from "react";
import { act, renderHook } from "@testing-library/react";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakeSettingsAboutPort, FAKE_ABOUT_LINKS } from "./__tests__/fakeSettingsAboutPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { useSettingsAboutViewModel } from "./useSettingsAboutViewModel";

const { openExternal, LinkingWrapper } = createFakeLinking();

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <I18nWrapper>
      <LinkingWrapper>{children}</LinkingWrapper>
    </I18nWrapper>
  );
}

function renderViewModel(port = createFakeSettingsAboutPort()) {
  const { result } = renderHook(() => useSettingsAboutViewModel({ port }), { wrapper: Wrapper });
  return { result, port };
}

function findRow(result: ReturnType<typeof renderViewModel>["result"], id: string) {
  const row = result.current.sections.flatMap(section => section.rows).find(r => r.id === id);
  if (!row) throw new Error(`no row ${id}`);
  return row;
}

beforeEach(() => {
  openExternal.mockClear();
});

describe("useSettingsAboutViewModel", () => {
  it("lists the legal rows, then the social rows under Connect with us", () => {
    const { result } = renderViewModel();

    expect(result.current.sections.map(section => [section.id, section.title])).toEqual([
      ["legal", undefined],
      ["social", "Connect with us"],
    ]);
    expect(result.current.sections.map(section => section.rows.map(row => row.id))).toEqual([
      ["version", "terms"],
      ["x", "instagram", "github"],
    ]);
  });

  it("shows the app version and the terms wording", () => {
    const { result } = renderViewModel();

    expect(findRow(result, "version")).toMatchObject({
      title: "Version",
      description: "1.2.3",
    });
    expect(findRow(result, "terms")).toMatchObject({
      title: "Terms and conditions",
      description:
        "By using Ledger Wallet you are deemed to have accepted our terms and conditions",
    });
  });

  it.each([
    ["terms", FAKE_ABOUT_LINKS.terms],
    ["x", FAKE_ABOUT_LINKS.x],
    ["instagram", FAKE_ABOUT_LINKS.instagram],
    ["github", FAKE_ABOUT_LINKS.github],
  ])("opens the %s link externally", (id, url) => {
    const { result } = renderViewModel();
    const row = findRow(result, id);

    act(() => {
      if (row.trailing?.type === "externalLink") row.trailing.onSelect();
    });

    expect(openExternal.mock.calls).toEqual([[url]]);
  });

  it("unlocks the developer tools on the fifth tap of the version row only", () => {
    const { result, port } = renderViewModel();

    for (let tap = 1; tap <= 4; tap++) {
      act(() => findRow(result, "version").onSelect?.());
    }
    expect(port.unlockDeveloperTools).not.toHaveBeenCalled();

    act(() => findRow(result, "version").onSelect?.());
    act(() => findRow(result, "version").onSelect?.());

    expect(port.unlockDeveloperTools).toHaveBeenCalledTimes(1);
  });
});
