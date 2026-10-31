import { CRYPTO_CURRENCIES_REGISTRY } from "./registry";
import type { ExplorerView } from "./schema";
import {
  getAddressExplorer,
  getDefaultExplorerView,
  getDRepExplorer,
  getStakePoolExplorer,
  getTokenExplorer,
  getTransactionExplorer,
} from "./explorer";

const view: ExplorerView = {
  tx: "https://explorer.test/tx/$hash",
  address: "https://explorer.test/address/$address",
  token: "https://explorer.test/token/$contractAddress?a=$address",
  stakePool: "https://explorer.test/pool/$poolId",
  dRep: "https://explorer.test/drep/$hex",
};

describe("getDefaultExplorerView", () => {
  it("returns the first explorer view of the currency", () => {
    const ethereum = CRYPTO_CURRENCIES_REGISTRY.ethereum;
    expect(getDefaultExplorerView(ethereum)).toBe(ethereum.explorerViews[0]);
  });

  it("returns undefined when the currency has no explorer view", () => {
    const currency = { ...CRYPTO_CURRENCIES_REGISTRY.ethereum, explorerViews: [] };
    expect(getDefaultExplorerView(currency)).toBeUndefined();
  });

  it("returns undefined when the currency carries no explorer views at all", () => {
    const { explorerViews: _ignored, ...currency } = CRYPTO_CURRENCIES_REGISTRY.ethereum;
    expect(
      getDefaultExplorerView(currency as typeof CRYPTO_CURRENCIES_REGISTRY.ethereum),
    ).toBeUndefined();
  });
});

describe.each([
  [
    "getTransactionExplorer",
    () => getTransactionExplorer(view, "0xhash"),
    "https://explorer.test/tx/0xhash",
  ],
  [
    "getAddressExplorer",
    () => getAddressExplorer(view, "0xabc"),
    "https://explorer.test/address/0xabc",
  ],
  [
    "getTokenExplorer",
    () => getTokenExplorer(view, "0xcontract", "0xowner"),
    "https://explorer.test/token/0xcontract?a=0xowner",
  ],
  [
    "getStakePoolExplorer",
    () => getStakePoolExplorer(view, "pool1"),
    "https://explorer.test/pool/pool1",
  ],
  ["getDRepExplorer", () => getDRepExplorer(view, "drep1"), "https://explorer.test/drep/drep1"],
])("%s", (_name, build, expected) => {
  it("fills the template", () => {
    expect(build()).toBe(expected);
  });
});

describe("missing view or template", () => {
  it("returns undefined without an explorer view", () => {
    expect(getTransactionExplorer(undefined, "0xhash")).toBeUndefined();
    expect(getAddressExplorer(undefined, "0xabc")).toBeUndefined();
    expect(getTokenExplorer(undefined, "0xcontract", "0xowner")).toBeUndefined();
    expect(getStakePoolExplorer(undefined, "pool1")).toBeUndefined();
    expect(getDRepExplorer(undefined, "drep1")).toBeUndefined();
  });

  it("returns undefined when the view lacks the template", () => {
    expect(getTransactionExplorer({}, "0xhash")).toBeUndefined();
    expect(getAddressExplorer({}, "0xabc")).toBeUndefined();
    expect(getTokenExplorer({}, "0xcontract", "0xowner")).toBeUndefined();
    expect(getStakePoolExplorer({}, "pool1")).toBeUndefined();
    expect(getDRepExplorer({}, "drep1")).toBeUndefined();
  });
});
