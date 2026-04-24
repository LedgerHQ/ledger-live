import { ScreenName } from "~/const";
import { appendRecoverDeeplinkReloadIfNeeded } from "../appendRecoverDeeplinkReloadIfNeeded";

describe("appendRecoverDeeplinkReloadIfNeeded", () => {
  it("returns the URL unchanged when hostname is not recover", () => {
    const url = "ledgerlive://portfolio";
    expect(appendRecoverDeeplinkReloadIfNeeded(url)).toBe(url);
  });

  it("returns the URL unchanged when not on Recover", () => {
    const url = "ledgerlive://recover/protect-staging?step=2";
    expect(
      appendRecoverDeeplinkReloadIfNeeded(url, {
        getCurrentRoute: () => ({ name: ScreenName.Portfolio, params: {} }),
      }),
    ).toBe(url);
  });

  it("returns the URL unchanged when platform differs", () => {
    const url = "ledgerlive://recover/protect-staging?step=2";
    expect(
      appendRecoverDeeplinkReloadIfNeeded(url, {
        getCurrentRoute: () => ({
          name: ScreenName.Recover,
          params: { platform: "other-app", step: "2" },
        }),
      }),
    ).toBe(url);
  });

  it("returns the URL unchanged when query identity differs", () => {
    const url = "ledgerlive://recover/protect-staging?step=2";
    expect(
      appendRecoverDeeplinkReloadIfNeeded(url, {
        getCurrentRoute: () => ({
          name: ScreenName.Recover,
          params: { platform: "protect-staging", step: "3" },
        }),
      }),
    ).toBe(url);
  });

  it("appends recoverDeeplinkAt when already on the same Recover URL (ignores manifest name on route)", () => {
    const url = "ledgerlive://recover/protect-staging?step=2";
    const out = appendRecoverDeeplinkReloadIfNeeded(url, {
      getCurrentRoute: () => ({
        name: ScreenName.Recover,
        params: {
          platform: "protect-staging",
          step: "2",
          name: "Ledger Recover",
        },
      }),
      now: () => 1_700_000_000_000,
    });
    const parsed = new URL(out);
    expect(parsed.searchParams.get("step")).toBe("2");
    expect(parsed.searchParams.get("recoverDeeplinkAt")).toBe("1700000000000");
  });

  it("accepts ledgerwallet scheme", () => {
    const url = "ledgerwallet://recover/protect-staging?step=2";
    const out = appendRecoverDeeplinkReloadIfNeeded(url, {
      getCurrentRoute: () => ({
        name: ScreenName.Recover,
        params: { platform: "protect-staging", step: "2" },
      }),
      now: () => 42,
    });
    expect(out).toContain("recoverDeeplinkAt=42");
  });
});
