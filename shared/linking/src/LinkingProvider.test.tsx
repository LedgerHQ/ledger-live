import React, { type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import { LinkingProvider, useOpenLink, useLocalizedUrl } from "./LinkingProvider";
import type { LinkingConfig } from "./types";

function TestHarness<T>({ hook, onResult }: { hook: () => T; onResult: (value: T) => void }): null {
  onResult(hook());
  return null;
}

function renderHookWithProvider<T>(hook: () => T, config: LinkingConfig): T {
  let result: T;
  const container = document.createElement("div");
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(
      <LinkingProvider config={config}>
        <TestHarness
          hook={hook}
          onResult={v => {
            result = v;
          }}
        />
      </LinkingProvider>,
    );
  });
  return result!;
}

describe("useOpenLink", () => {
  it("throws when used outside provider", () => {
    const container = document.createElement("div");
    const root = ReactDOM.createRoot(container);
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      act(() => {
        root.render(<TestHarness hook={() => useOpenLink()} onResult={() => {}} />);
      });
    }).toThrow("useOpenLink must be used within");

    spy.mockRestore();
  });

  it("calls openExternal with the URL", () => {
    const openExternal = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), { openExternal });

    openLink("https://support.ledger.com");
    expect(openExternal).toHaveBeenCalledWith("https://support.ledger.com");
  });

  it("calls onLinkOpened callback when provided", () => {
    const openExternal = jest.fn();
    const onLinkOpened = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), {
      openExternal,
      onLinkOpened,
    });

    openLink("https://support.ledger.com");
    expect(onLinkOpened).toHaveBeenCalledWith("https://support.ledger.com");
    expect(openExternal).toHaveBeenCalledWith("https://support.ledger.com");
  });

  it("works without onLinkOpened", () => {
    const openExternal = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), { openExternal });

    openLink("https://support.ledger.com");
    expect(openExternal).toHaveBeenCalledWith("https://support.ledger.com");
  });

  it("blocks unsafe URLs before calling openExternal", () => {
    const openExternal = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), { openExternal });

    expect(() => openLink("javascript:alert(1)")).toThrow("Blocked unsafe protocol");
    expect(openExternal).not.toHaveBeenCalled();
  });

  it("blocks http URLs", () => {
    const openExternal = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), { openExternal });

    expect(() => openLink("http://ledger.com")).toThrow("Blocked unsafe protocol");
    expect(openExternal).not.toHaveBeenCalled();
  });

  it("allows mailto URLs", () => {
    const openExternal = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), { openExternal });

    openLink("mailto:support@ledger.com");
    expect(openExternal).toHaveBeenCalledWith("mailto:support@ledger.com");
  });

  it("does not localize — caller is responsible via useLocalizedUrl", () => {
    const openExternal = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), {
      openExternal,
      localization: {
        currentLanguage: "fr",
        defaultLanguage: "en",
        languages: { en: "", fr: "fr" },
      },
    });

    openLink("https://www.ledger.com/academy");
    expect(openExternal).toHaveBeenCalledWith("https://www.ledger.com/academy");
  });

  it("swallows rejected promises from openExternal", async () => {
    const openExternal = jest.fn().mockRejectedValue(new Error("platform error"));
    const openLink = renderHookWithProvider(() => useOpenLink(), { openExternal });

    openLink("https://support.ledger.com");
    await new Promise(r => setTimeout(r, 0));
    expect(openExternal).toHaveBeenCalled();
  });

  it("does not call onLinkOpened when URL is unsafe", () => {
    const openExternal = jest.fn();
    const onLinkOpened = jest.fn();
    const openLink = renderHookWithProvider(() => useOpenLink(), { openExternal, onLinkOpened });

    expect(() => openLink("javascript:void(0)")).toThrow();
    expect(onLinkOpened).not.toHaveBeenCalled();
    expect(openExternal).not.toHaveBeenCalled();
  });
});

describe("useLocalizedUrl", () => {
  it("returns the URL unchanged without localization config", () => {
    const url = renderHookWithProvider(() => useLocalizedUrl("https://www.ledger.com/academy"), {
      openExternal: jest.fn(),
    });
    expect(url).toBe("https://www.ledger.com/academy");
  });

  it("returns a localized URL with localization config", () => {
    const url = renderHookWithProvider(() => useLocalizedUrl("https://www.ledger.com/academy"), {
      openExternal: jest.fn(),
      localization: {
        currentLanguage: "fr",
        defaultLanguage: "en",
        languages: { en: "", fr: "fr" },
      },
    });
    expect(url).toBe("https://www.ledger.com/fr/academy");
  });

  it("returns the URL unchanged for the default language", () => {
    const url = renderHookWithProvider(() => useLocalizedUrl("https://www.ledger.com/academy"), {
      openExternal: jest.fn(),
      localization: {
        currentLanguage: "en",
        defaultLanguage: "en",
        languages: { en: "", fr: "fr" },
      },
    });
    expect(url).toBe("https://www.ledger.com/academy");
  });

  it("returns non-Ledger URLs unchanged even with localization", () => {
    const url = renderHookWithProvider(() => useLocalizedUrl("https://github.com/LedgerHQ"), {
      openExternal: jest.fn(),
      localization: {
        currentLanguage: "fr",
        defaultLanguage: "en",
        languages: { en: "", fr: "fr" },
      },
    });
    expect(url).toBe("https://github.com/LedgerHQ");
  });
});
