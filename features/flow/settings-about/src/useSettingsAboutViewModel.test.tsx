import React from "react";
import { act, renderHook } from "@testing-library/react";
import { createFakeLinking } from "./__tests__/fakeLinking";
import {
  createFakeMobileSettingsAboutPort,
  createFakeSettingsAboutPort,
  FAKE_STORE_REVIEW_URL,
  FAKE_TERMS_URL,
} from "./__tests__/fakeSettingsAboutPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { socialUrls } from "./urls";
import type { SettingsAboutPort } from "./ports";
import { useSettingsAboutViewModel } from "./useSettingsAboutViewModel";

const { openExternal, LinkingWrapper } = createFakeLinking();

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <I18nWrapper>
      <LinkingWrapper>{children}</LinkingWrapper>
    </I18nWrapper>
  );
}

function renderViewModel<Port extends SettingsAboutPort>(port: Port) {
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
    const { result } = renderViewModel(createFakeSettingsAboutPort());

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
    const { result } = renderViewModel(createFakeSettingsAboutPort());

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
    ["terms", FAKE_TERMS_URL],
    ["x", socialUrls.twitter],
    ["instagram", socialUrls.instagram],
    ["github", socialUrls.github],
  ])("opens the %s link externally", (id, url) => {
    const { result } = renderViewModel(createFakeSettingsAboutPort());
    const row = findRow(result, id);

    act(() => {
      if (row.trailing?.type === "externalLink") row.trailing.onSelect();
    });

    expect(openExternal.mock.calls).toEqual([[url]]);
  });

  it("unlocks the developer tools on the fifth tap of the version row only", () => {
    const { result, port } = renderViewModel(createFakeSettingsAboutPort());

    for (let tap = 1; tap <= 4; tap++) {
      act(() => findRow(result, "version").onSelect?.());
    }
    expect(port.unlockDeveloperTools).not.toHaveBeenCalled();

    act(() => findRow(result, "version").onSelect?.());
    act(() => findRow(result, "version").onSelect?.());

    expect(port.unlockDeveloperTools).toHaveBeenCalledTimes(1);
  });

  it("has no feedback row when the app does not provide the feedback action", () => {
    const { result } = renderViewModel(createFakeSettingsAboutPort());

    expect(result.current.sections[0].rows.map(row => row.id)).toEqual(["version", "terms"]);
  });
});

describe("useSettingsAboutViewModel on mobile", () => {
  it("shows the feedback row first, in the Connect with us section", () => {
    const { result } = renderViewModel(createFakeMobileSettingsAboutPort());

    expect(result.current.sections[0].rows.map(row => row.id)).toEqual(["version", "terms"]);
    expect(result.current.sections[1].rows.map(row => row.id)).toEqual([
      "feedback",
      "rate",
      "x",
      "instagram",
      "github",
    ]);
    expect(findRow(result, "feedback")).toMatchObject({
      title: "Give us feedback on the app",
    });
  });

  it("titles the rate row with the store the app gives", () => {
    const port = {
      ...createFakeMobileSettingsAboutPort(),
      storeReview: { url: FAKE_STORE_REVIEW_URL, storeName: "Play Store" },
    };
    const { result } = renderViewModel(port);

    expect(findRow(result, "rate")).toMatchObject({ title: "Rate us on Play Store" });
  });

  it("opens the store review page when the rate row is selected", () => {
    const { result } = renderViewModel(createFakeMobileSettingsAboutPort());

    act(() => {
      const row = findRow(result, "rate");
      if (row.trailing?.type === "externalLink") row.trailing.onSelect();
    });

    expect(openExternal.mock.calls).toEqual([[FAKE_STORE_REVIEW_URL]]);
  });

  it("opens the feedback flow when the feedback row is selected", () => {
    const { result, port } = renderViewModel(createFakeMobileSettingsAboutPort());

    act(() => findRow(result, "feedback").onSelect?.());

    expect(port.feedback).toHaveBeenCalledTimes(1);
  });

  it.each(["version", "terms", "feedback", "rate", "x", "instagram", "github"] as const)(
    "reports the %s row to the app when it is selected",
    id => {
      const { result, port } = renderViewModel(createFakeMobileSettingsAboutPort());
      const row = findRow(result, id);

      act(() => {
        if (row.trailing?.type === "externalLink") row.trailing.onSelect();
        else row.onSelect?.();
      });

      expect(port.onRowSelect.mock.calls).toEqual([[id]]);
    },
  );
});
