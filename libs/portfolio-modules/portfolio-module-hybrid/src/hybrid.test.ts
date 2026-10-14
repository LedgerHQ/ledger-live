import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type {
  Portfolio,
  PortfolioApi,
  RegistrationInput,
  UpdateView,
} from "@ledgerhq/portfolio-module-framework";
import { createHybridPortfolio } from "./hybrid";
import { decodeCursors } from "./token";
import type { HybridPortfolioApi } from "./types";

type FakePortfolioApi = jest.Mocked<PortfolioApi>;

const fakePortfolioApi = (networks: string[]): FakePortfolioApi => ({
  getPortfolio: jest.fn(),
  createPortfolio: jest.fn(),
  addRegistrations: jest.fn(),
  removeRegistrations: jest.fn(),
  addAddresses: jest.fn(),
  getUpdates: jest.fn(),
  getPortfolioBalance: jest.fn(),
  getPortfolioBalanceHistory: jest.fn(),
  listNetworks: jest.fn().mockResolvedValue(networks),
  getLastBlock: jest.fn(),
  getValidators: jest.fn(),
  validateAddress: jest.fn(),
  getNextSequence: jest.fn(),
  estimateTransactionFee: jest.fn(),
  encodeTransaction: jest.fn(),
  combineTransaction: jest.fn(),
  broadcastTransaction: jest.fn(),
});

const notFound = () => new PortfolioApiError("NOT_FOUND", "missing");

const bitcoinRegistration = { type: "auto_derive", network: "bitcoin", xpub: "xpub" } as const;
const evmRegistration = { type: "evm", address: "0xabc" } as const;

const localPortfolio: Portfolio = {
  id: "p1",
  registrations: [{ ...bitcoinRegistration, id: "reg-btc" }],
  accounts: [{ id: "acc-btc", network: "bitcoin", status: "synchronized" }],
};
const remotePortfolio: Portfolio = {
  id: "p1",
  registrations: [{ ...evmRegistration, id: "reg-evm" }],
  accounts: [{ id: "acc-eth", network: "ethereum", status: "synchronized" }],
};
const mergedPortfolio: Portfolio = {
  id: "p1",
  registrations: [...localPortfolio.registrations!, ...remotePortfolio.registrations!],
  accounts: [...localPortfolio.accounts!, ...remotePortfolio.accounts!],
};

const update = (txHash: string, time: string): UpdateView => ({
  network: "bitcoin",
  accountId: "acc",
  operation: {},
  time,
  txHash,
});

let local: FakePortfolioApi & { sync: jest.Mock };
let remote: FakePortfolioApi;
let hybrid: HybridPortfolioApi;

beforeEach(() => {
  local = {
    ...fakePortfolioApi(["bitcoin", "ethereum", "litecoin"]),
    sync: jest.fn().mockResolvedValue("synced"),
  };
  remote = fakePortfolioApi(["ethereum", "solana", "polygon"]);
  hybrid = createHybridPortfolio({ local, remote });
});

const givenPortfolios = () => {
  local.getPortfolio.mockResolvedValue(localPortfolio);
  remote.getPortfolio.mockResolvedValue(remotePortfolio);
};

describe("createPortfolio", () => {
  it("creates the portfolio on both sides and merges them", async () => {
    local.createPortfolio.mockResolvedValue({ id: "p1" });
    remote.createPortfolio.mockResolvedValue({ id: "p1" });

    await expect(hybrid.createPortfolio("p1")).resolves.toEqual({
      id: "p1",
      registrations: [],
      accounts: [],
    });
    expect(local.createPortfolio).toHaveBeenCalledWith("p1");
    expect(remote.createPortfolio).toHaveBeenCalledWith("p1");
  });
});

describe("getPortfolio", () => {
  it("merges the registrations and accounts of both sides", async () => {
    givenPortfolios();

    await expect(hybrid.getPortfolio("p1")).resolves.toEqual(mergedPortfolio);
  });

  it("serves one side when the other answers NOT_FOUND", async () => {
    local.getPortfolio.mockRejectedValue(notFound());
    remote.getPortfolio.mockResolvedValue(remotePortfolio);

    await expect(hybrid.getPortfolio("p1")).resolves.toEqual(remotePortfolio);
  });

  it("answers NOT_FOUND when both sides do", async () => {
    local.getPortfolio.mockRejectedValue(notFound());
    remote.getPortfolio.mockRejectedValue(notFound());

    await expect(hybrid.getPortfolio("p1")).rejects.toMatchObject({ type: "NOT_FOUND" });
  });

  it("propagates other errors", async () => {
    local.getPortfolio.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockRejectedValue(new PortfolioApiError("UNAVAILABLE", "down"));

    await expect(hybrid.getPortfolio("p1")).rejects.toMatchObject({ type: "UNAVAILABLE" });
  });
});

describe("addRegistrations", () => {
  it("sends each registration to the remote when it serves its network, else local", async () => {
    const solana: RegistrationInput = { type: "solana", address: "So1" };
    const tron: RegistrationInput = { type: "static", accountId: "t", network: "tron" };
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.addRegistrations.mockResolvedValue(remotePortfolio);

    await expect(
      hybrid.addRegistrations("p1", [evmRegistration, bitcoinRegistration, solana, tron]),
    ).resolves.toEqual(mergedPortfolio);
    expect(local.addRegistrations).toHaveBeenCalledWith("p1", [bitcoinRegistration, tron]);
    expect(remote.addRegistrations).toHaveBeenCalledWith("p1", [evmRegistration, solana]);
  });

  it("reads the portfolio of the side receiving no registration", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockResolvedValue(remotePortfolio);

    await expect(hybrid.addRegistrations("p1", [bitcoinRegistration])).resolves.toEqual(
      mergedPortfolio,
    );
    expect(remote.addRegistrations).not.toHaveBeenCalled();
    expect(local.getPortfolio).not.toHaveBeenCalled();
  });

  it("counts a side not knowing the portfolio as empty", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockRejectedValue(notFound());

    await expect(hybrid.addRegistrations("p1", [bitcoinRegistration])).resolves.toEqual(
      localPortfolio,
    );
  });

  it("follows a custom routing, given the networks of both sides", async () => {
    const routeRegistration = jest.fn().mockReturnValue("local");
    hybrid = createHybridPortfolio({ local, remote, routeRegistration });
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockResolvedValue({ id: "p1" });

    await hybrid.addRegistrations("p1", [evmRegistration]);

    expect(routeRegistration).toHaveBeenCalledWith(evmRegistration, {
      local: ["bitcoin", "ethereum", "litecoin"],
      remote: ["ethereum", "solana", "polygon"],
    });
    expect(local.addRegistrations).toHaveBeenCalledWith("p1", [evmRegistration]);
  });
});

describe("removeRegistrations", () => {
  it("sends each registration id to the side owning it", async () => {
    givenPortfolios();
    local.removeRegistrations.mockResolvedValue({ id: "p1" });
    remote.removeRegistrations.mockResolvedValue({ id: "p1" });

    await expect(hybrid.removeRegistrations("p1", ["reg-evm", "reg-btc"])).resolves.toEqual({
      id: "p1",
      registrations: [],
      accounts: [],
    });
    expect(local.removeRegistrations).toHaveBeenCalledWith("p1", ["reg-btc"]);
    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["reg-evm"]);
  });

  it("ignores ids no side owns and still answers the portfolio", async () => {
    givenPortfolios();
    local.removeRegistrations.mockResolvedValue({ id: "p1" });

    await expect(hybrid.removeRegistrations("p1", ["reg-btc", "unknown"])).resolves.toEqual({
      id: "p1",
      registrations: remotePortfolio.registrations,
      accounts: remotePortfolio.accounts,
    });
    expect(local.removeRegistrations).toHaveBeenCalledWith("p1", ["reg-btc"]);
    expect(remote.removeRegistrations).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND when no side knows the portfolio", async () => {
    local.getPortfolio.mockRejectedValue(notFound());
    remote.getPortfolio.mockRejectedValue(notFound());

    await expect(hybrid.removeRegistrations("p1", ["reg-btc"])).rejects.toMatchObject({
      type: "NOT_FOUND",
    });
  });
});

describe("addAddresses", () => {
  const request = { type: "static", addresses: ["addr"] };

  it("sends the addresses to the side owning the account", async () => {
    givenPortfolios();
    const account = remotePortfolio.accounts![0]!;
    remote.addAddresses.mockResolvedValue(account);

    await expect(hybrid.addAddresses("p1", "acc-eth", request)).resolves.toBe(account);
    expect(remote.addAddresses).toHaveBeenCalledWith("p1", "acc-eth", request);
    expect(local.addAddresses).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND for an account no side owns", async () => {
    givenPortfolios();

    await expect(hybrid.addAddresses("p1", "unknown", request)).rejects.toMatchObject({
      type: "NOT_FOUND",
      message: "Account unknown not found",
    });
    expect(local.addAddresses).not.toHaveBeenCalled();
    expect(remote.addAddresses).not.toHaveBeenCalled();
  });
});

describe("getUpdates", () => {
  it("merges a page of each side, most recent first, then continues each side", async () => {
    local.getUpdates.mockResolvedValueOnce({ items: [update("l1", "2026-01-02T00:00:00Z")] });
    remote.getUpdates
      .mockResolvedValueOnce({
        items: [update("r1", "2026-01-03T00:00:00Z"), update("r2", "2026-01-01T00:00:00Z")],
        nextToken: "remote-2",
      })
      .mockResolvedValueOnce({ items: [update("r3", "2025-12-31T00:00:00Z")] });

    const first = await hybrid.getUpdates("p1", { size: 2 });
    const second = await hybrid.getUpdates("p1", { size: 2, token: first.nextToken! });

    expect(first.items!.map(({ txHash }) => txHash)).toEqual(["r1", "l1", "r2"]);
    expect(local.getUpdates).toHaveBeenCalledTimes(1);
    expect(local.getUpdates).toHaveBeenCalledWith("p1", { size: 2 });
    expect(remote.getUpdates).toHaveBeenNthCalledWith(1, "p1", { size: 2 });
    expect(remote.getUpdates).toHaveBeenNthCalledWith(2, "p1", { size: 2, token: "remote-2" });
    expect(second).toEqual({ items: [update("r3", "2025-12-31T00:00:00Z")] });
  });

  it("sorts the merged page oldest first in ASC order", async () => {
    local.getUpdates.mockResolvedValue({ items: [update("l1", "2026-01-02T00:00:00Z")] });
    remote.getUpdates.mockResolvedValue({ items: [update("r1", "2026-01-01T00:00:00Z")] });

    const page = await hybrid.getUpdates("p1", { order: "ASC" });

    expect(page.items!.map(({ txHash }) => txHash)).toEqual(["r1", "l1"]);
    expect(remote.getUpdates).toHaveBeenCalledWith("p1", { order: "ASC" });
  });

  it("reads both sides from the start without a query", async () => {
    local.getUpdates.mockResolvedValue({});
    remote.getUpdates.mockResolvedValue({});

    await expect(hybrid.getUpdates("p1")).resolves.toEqual({ items: [] });
    expect(local.getUpdates).toHaveBeenCalledWith("p1", {});
    expect(remote.getUpdates).toHaveBeenCalledWith("p1", {});
  });

  it("reads only the side owning the account filtered on", async () => {
    givenPortfolios();
    local.getUpdates.mockResolvedValue({ items: [update("l1", "2026-01-01T00:00:00Z")] });

    await hybrid.getUpdates("p1", { account: "acc-btc", address: "bc1q" });

    expect(local.getUpdates).toHaveBeenCalledWith("p1", { account: "acc-btc", address: "bc1q" });
    expect(remote.getUpdates).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND for an account no side owns", async () => {
    givenPortfolios();

    await expect(hybrid.getUpdates("p1", { account: "unknown" })).rejects.toMatchObject({
      type: "NOT_FOUND",
    });
  });

  it("reads only the sides serving the network filtered on", async () => {
    remote.getUpdates.mockResolvedValue({});

    await hybrid.getUpdates("p1", { network: "solana", asset: "native" });

    expect(remote.getUpdates).toHaveBeenCalledWith("p1", { network: "solana", asset: "native" });
    expect(local.getUpdates).not.toHaveBeenCalled();
  });

  it("reads both sides for a network both serve", async () => {
    local.getUpdates.mockResolvedValue({});
    remote.getUpdates.mockResolvedValue({});

    await hybrid.getUpdates("p1", { network: "ethereum" });

    expect(local.getUpdates).toHaveBeenCalledWith("p1", { network: "ethereum" });
    expect(remote.getUpdates).toHaveBeenCalledWith("p1", { network: "ethereum" });
  });

  it("answers an empty page for a network no side serves", async () => {
    await expect(hybrid.getUpdates("p1", { network: "tron" })).resolves.toEqual({ items: [] });
    expect(local.getUpdates).not.toHaveBeenCalled();
    expect(remote.getUpdates).not.toHaveBeenCalled();
  });

  it("answers BAD_REQUEST for a malformed token without reading any side", async () => {
    await expect(hybrid.getUpdates("p1", { token: "not a token" })).rejects.toMatchObject({
      type: "BAD_REQUEST",
    });
    expect(local.getUpdates).not.toHaveBeenCalled();
    expect(remote.getUpdates).not.toHaveBeenCalled();
  });
});

describe("getPortfolioBalance", () => {
  const balances = (account_id: string) => ({
    type: "failure" as const,
    network: "bitcoin",
    account_id,
    error: "unavailable",
  });

  it("concatenates the pages of both sides, local first, with each side's token", async () => {
    local.getPortfolioBalance.mockResolvedValue({ items: [balances("l1")], nextToken: "l2" });
    remote.getPortfolioBalance.mockResolvedValue({ items: [balances("r1")] });

    const page = await hybrid.getPortfolioBalance("p1", { currency: "usd" });

    expect(page.items).toEqual([balances("l1"), balances("r1")]);
    expect(decodeCursors(page.nextToken!)).toEqual({ local: "l2", remote: null });
    expect(local.getPortfolioBalance).toHaveBeenCalledWith("p1", { currency: "usd" });
  });

  it("reads both sides from the start without a query", async () => {
    local.getPortfolioBalance.mockResolvedValue({});
    remote.getPortfolioBalance.mockResolvedValue({});

    await expect(hybrid.getPortfolioBalance("p1")).resolves.toEqual({ items: [] });
    expect(remote.getPortfolioBalance).toHaveBeenCalledWith("p1", {});
  });
});

describe("getPortfolioBalanceHistory", () => {
  const point = (account_id: string) => ({
    network: "bitcoin",
    account_id,
    asset: "native",
    time: "2026-01-01T00:00:00Z",
    value: "1",
  });

  it("concatenates the pages of both sides, local first, with each side's token", async () => {
    local.getPortfolioBalanceHistory.mockResolvedValue({ items: [point("l1")] });
    remote.getPortfolioBalanceHistory.mockResolvedValue({ items: [point("r1")], nextToken: "r2" });

    const page = await hybrid.getPortfolioBalanceHistory("p1", { range: "week" });

    expect(page.items).toEqual([point("l1"), point("r1")]);
    expect(decodeCursors(page.nextToken!)).toEqual({ local: null, remote: "r2" });
    expect(remote.getPortfolioBalanceHistory).toHaveBeenCalledWith("p1", { range: "week" });
  });

  it("reads both sides from the start without a query", async () => {
    local.getPortfolioBalanceHistory.mockResolvedValue({});
    remote.getPortfolioBalanceHistory.mockResolvedValue({});

    await expect(hybrid.getPortfolioBalanceHistory("p1")).resolves.toEqual({ items: [] });
    expect(local.getPortfolioBalanceHistory).toHaveBeenCalledWith("p1", {});
  });
});

describe("listNetworks", () => {
  it("lists the networks of both sides once each", async () => {
    await expect(hybrid.listNetworks()).resolves.toEqual([
      "bitcoin",
      "ethereum",
      "litecoin",
      "solana",
      "polygon",
    ]);
  });

  it("asks each side once, routing included", async () => {
    remote.getLastBlock.mockResolvedValue({ height: 1 });

    await hybrid.listNetworks();
    await hybrid.getLastBlock("ethereum");

    expect(local.listNetworks).toHaveBeenCalledTimes(1);
    expect(remote.listNetworks).toHaveBeenCalledTimes(1);
  });
});

type NetworkMethod =
  | "getLastBlock"
  | "getValidators"
  | "validateAddress"
  | "getNextSequence"
  | "estimateTransactionFee"
  | "encodeTransaction"
  | "combineTransaction"
  | "broadcastTransaction";

const call = (api: PortfolioApi, method: NetworkMethod, args: unknown[]) =>
  (api[method] as (...args: unknown[]) => Promise<unknown>)(...args);

const intent = { type: "send", sender: "addr", amount: "1" };
const READS: [NetworkMethod, unknown[]][] = [
  ["getLastBlock", []],
  ["getValidators", [{ cursor: "c1" }]],
  ["validateAddress", ["addr"]],
  ["getNextSequence", ["addr"]],
];
const WRITES: [NetworkMethod, unknown[]][] = [
  ["estimateTransactionFee", [{ intent }]],
  ["encodeTransaction", [{ intent, customFees: "10" }]],
  ["combineTransaction", [{ rawTransaction: "raw", signature: "sig" }]],
  ["broadcastTransaction", [{ signedTransaction: "signed" }]],
];

describe("network reads", () => {
  it.each(READS)("routes %s to the remote when it serves the network", async (method, args) => {
    remote[method].mockResolvedValue("answer" as never);

    await expect(call(hybrid, method, ["ethereum", ...args])).resolves.toBe("answer");
    expect(remote[method]).toHaveBeenCalledWith("ethereum", ...args);
    expect(local[method]).not.toHaveBeenCalled();
  });

  it.each(READS)("routes %s locally otherwise", async (method, args) => {
    local[method].mockResolvedValue("answer" as never);

    await expect(call(hybrid, method, ["bitcoin", ...args])).resolves.toBe("answer");
    expect(local[method]).toHaveBeenCalledWith("bitcoin", ...args);
    expect(remote[method]).not.toHaveBeenCalled();
  });

  it("follows a custom routing", async () => {
    const routeRead = jest.fn().mockReturnValue("local");
    hybrid = createHybridPortfolio({ local, remote, routeRead });
    local.getLastBlock.mockResolvedValue({ height: 1 });

    await hybrid.getLastBlock("ethereum");

    expect(routeRead).toHaveBeenCalledWith("ethereum", {
      local: ["bitcoin", "ethereum", "litecoin"],
      remote: ["ethereum", "solana", "polygon"],
    });
    expect(remote.getLastBlock).not.toHaveBeenCalled();
  });
});

describe("writes", () => {
  it.each(WRITES)("routes %s locally when it serves the network", async (method, args) => {
    local[method].mockResolvedValue("answer" as never);

    await expect(call(hybrid, method, ["ethereum", ...args])).resolves.toBe("answer");
    expect(local[method]).toHaveBeenCalledWith("ethereum", ...args);
    expect(remote[method]).not.toHaveBeenCalled();
  });

  it.each(WRITES)("routes %s to the remote otherwise", async (method, args) => {
    remote[method].mockResolvedValue("answer" as never);

    await expect(call(hybrid, method, ["solana", ...args])).resolves.toBe("answer");
    expect(remote[method]).toHaveBeenCalledWith("solana", ...args);
    expect(local[method]).not.toHaveBeenCalled();
  });

  it("follows a custom routing", async () => {
    const routeWrite = jest.fn().mockReturnValue("remote");
    hybrid = createHybridPortfolio({ local, remote, routeWrite });
    remote.broadcastTransaction.mockResolvedValue({ transactionId: "tx" });

    await hybrid.broadcastTransaction("bitcoin", { signedTransaction: "signed" });

    expect(remote.broadcastTransaction).toHaveBeenCalledWith("bitcoin", {
      signedTransaction: "signed",
    });
    expect(local.broadcastTransaction).not.toHaveBeenCalled();
  });
});

describe("sync", () => {
  it("syncs the local side and resolves nothing", async () => {
    const signal = new AbortController().signal;

    await expect(hybrid.sync("p1", { signal })).resolves.toBeUndefined();
    expect(local.sync).toHaveBeenCalledWith("p1", { signal });
  });

  it("does nothing when the local side cannot sync", async () => {
    const { sync: _sync, ...localWithoutSync } = local;
    hybrid = createHybridPortfolio({ local: localWithoutSync, remote });

    await expect(hybrid.sync("p1")).resolves.toBeUndefined();
    expect(local.sync).not.toHaveBeenCalled();
  });
});
