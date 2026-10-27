import type { AccountNoticeSignals } from "../model/types";
import { resolveAccountNotices } from "./resolveAccountNotices";

const SUPPORT = "https://support.ledger.com";

const signals = (overrides: Partial<AccountNoticeSignals> = {}): AccountNoticeSignals => ({
  currencyName: "Adi",
  supportLink: SUPPORT,
  isRobinhoodChain: false,
  isRobinhoodDisclaimerEnabled: true,
  isPerpsAccount: false,
  isPerpsEnabled: true,
  ...overrides,
});

const ids = (overrides: Partial<AccountNoticeSignals>) =>
  resolveAccountNotices(signals(overrides)).map(({ id }) => id);

describe("resolveAccountNotices", () => {
  it("has no notice for a regular account", () => {
    expect(resolveAccountNotices(signals())).toEqual([]);
  });

  it("links the migration to its page, or to support without one", () => {
    expect(
      resolveAccountNotices(signals({ status: { type: "migration", from: "A", to: "B" } })),
    ).toEqual([
      { id: "migration", from: "A", to: "B", action: { type: "learnMore", link: SUPPORT } },
    ]);
  });

  it("announces the deprecation date with its link", () => {
    expect(
      resolveAccountNotices(
        signals({
          status: { type: "willBeDeprecated", date: "Jan 1, 2027", link: "https://ledger.com/d" },
        }),
      ),
    ).toEqual([
      {
        id: "willBeDeprecated",
        currencyName: "Adi",
        date: "Jan 1, 2027",
        action: { type: "learnMore", link: "https://ledger.com/d" },
      },
    ]);
  });

  it("shows the remote custom banner, with Learn more only when it has a link", () => {
    expect(resolveAccountNotices(signals({ customBanner: { text: "Heads up" } }))).toEqual([
      { id: "custom", text: "Heads up", action: undefined },
    ]);
  });

  it("shows the Robinhood disclaimer on a Robinhood chain account", () => {
    expect(ids({ isRobinhoodChain: true })).toEqual(["robinhoodDisclaimer"]);
  });

  it("hides the Robinhood disclaimer when its flag is off", () => {
    expect(ids({ isRobinhoodChain: true, isRobinhoodDisclaimerEnabled: false })).toEqual([]);
  });

  it("offers Perps on a Perps account when Perps is enabled", () => {
    expect(resolveAccountNotices(signals({ isPerpsAccount: true }))).toEqual([
      { id: "perps", action: { type: "openPerps" } },
    ]);
    expect(ids({ isPerpsAccount: true, isPerpsEnabled: false })).toEqual([]);
  });

  it("orders status, custom banner, Robinhood then Perps", () => {
    expect(
      ids({
        status: { type: "migration", from: "A", to: "B" },
        customBanner: { text: "Heads up" },
        isRobinhoodChain: true,
        isPerpsAccount: true,
      }),
    ).toEqual(["migration", "custom", "robinhoodDisclaimer", "perps"]);
  });
});
