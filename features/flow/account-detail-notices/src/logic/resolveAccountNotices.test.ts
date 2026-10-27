import type { AccountNoticeSignals } from "../model/types";
import { resolveAccountNotices } from "./resolveAccountNotices";

const SUPPORT = "https://support.ledger.com";

const signals = (overrides: Partial<AccountNoticeSignals> = {}): AccountNoticeSignals => ({
  currencyId: "adi",
  currencyName: "Adi",
  family: "evm",
  supportLink: SUPPORT,
  isRobinhoodDisclaimerEnabled: true,
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

  it.each(["robinhood", "robinhood_testnet"])(
    "shows the Robinhood disclaimer on every %s account",
    currencyId => {
      expect(ids({ currencyId })).toEqual(["robinhoodDisclaimer"]);
    },
  );

  it("hides the Robinhood disclaimer when its flag is off", () => {
    expect(ids({ currencyId: "robinhood", isRobinhoodDisclaimerEnabled: false })).toEqual([]);
  });

  it("offers Perps on a Hypercore account when Perps is enabled", () => {
    expect(resolveAccountNotices(signals({ family: "hypercore" }))).toEqual([
      { id: "perps", action: { type: "openPerps" } },
    ]);
    expect(ids({ family: "hypercore", isPerpsEnabled: false })).toEqual([]);
  });

  it("orders status, custom banner, Robinhood then Perps", () => {
    expect(
      ids({
        status: { type: "migration", from: "A", to: "B" },
        customBanner: { text: "Heads up" },
        currencyId: "robinhood",
        family: "hypercore",
      }),
    ).toEqual(["migration", "custom", "robinhoodDisclaimer", "perps"]);
  });
});
