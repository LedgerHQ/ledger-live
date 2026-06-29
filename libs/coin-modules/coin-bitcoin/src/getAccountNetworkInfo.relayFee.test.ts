import { Account } from "@ledgerhq/types-live";

const explorerWith = (relay_fee?: string) => ({
  getFees: jest.fn().mockResolvedValue({ "2": 3000, "3": 2000, "6": 1000 }),
  // getRelayFeeFloorSatVb only calls getNetwork when it exists; omit it to simulate a node
  // that does not expose the relay fee.
  ...(relay_fee !== undefined ? { getNetwork: jest.fn().mockResolvedValue({ relay_fee }) } : {}),
});

let currentExplorer = explorerWith("0.00001000");

jest.mock("./wallet-btc", () => ({
  __esModule: true,
  getWalletAccount: jest.fn(() => ({ xpub: { explorer: currentExplorer } })),
}));

import { getAccountNetworkInfo } from "./getAccountNetworkInfo";

const account = (id = "bitcoin") => ({ currency: { id } }) as unknown as Account;

describe("getAccountNetworkInfo relayFeePerByte", () => {
  it("uses the relay fee returned by the node (not the fallback)", async () => {
    currentExplorer = explorerWith("0.00003000"); // 3 sat/vB
    const info = await getAccountNetworkInfo(account());
    expect(info.relayFeePerByte.toNumber()).toBe(3);
  });

  it("falls back to 1 sat/vB when the node does not return a relay fee", async () => {
    currentExplorer = explorerWith(undefined);
    const info = await getAccountNetworkInfo(account());
    expect(info.relayFeePerByte.toNumber()).toBe(1);
  });

  it("uses the node relay fee as-is for non-bitcoin coins (no 1 sat/vB clamp)", async () => {
    currentExplorer = explorerWith("0.00003000"); // 3 sat/vB
    const info = await getAccountNetworkInfo(account("litecoin"));
    expect(info.relayFeePerByte.toNumber()).toBe(3);
  });

  it("sets 0 (no floor) for non-bitcoin coins when the node has no relay fee", async () => {
    currentExplorer = explorerWith(undefined);
    const info = await getAccountNetworkInfo(account("litecoin"));
    expect(info.relayFeePerByte.toNumber()).toBe(0);
  });
});
