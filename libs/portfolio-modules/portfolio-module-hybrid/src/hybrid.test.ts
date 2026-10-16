import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type {
  AccountBalances,
  BalanceHistoryPoint,
  Network,
  PageView,
  Portfolio,
  PortfolioAccount,
  PortfolioApi,
  PortfolioMode,
  Registration,
  RegistrationInput,
  UpdateView,
} from "@ledgerhq/portfolio-module-framework";
import { createHybridPortfolio } from "./hybrid";
import { decodeCursors } from "./token";
import type { HybridPortfolioApi, ModeOf, Side } from "./types";

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

/** bitcoin is hybrid, litecoin local, ethereum and solana remote; any other network local. */
const MODES: Record<Network, PortfolioMode> = {
  bitcoin: "hybrid",
  litecoin: "local",
  ethereum: "remote",
  solana: "remote",
};

const btcInput = { type: "auto_derive", network: "bitcoin", xpub: "xpub-btc" } as const;
const ltcInput = { type: "auto_derive", network: "litecoin", xpub: "xpub-ltc" } as const;
const evmInput = { type: "evm", address: "0xabc" } as const;
const solanaInput: RegistrationInput = { type: "solana", address: "So1" };
const tronInput: RegistrationInput = { type: "static", accountId: "t", network: "tron" };

const account = (id: string, network: Network): PortfolioAccount => ({
  id,
  network,
  status: "synchronized",
});

// The local side holds the hidden twin of the hybrid bitcoin registration.
const localBtc: Registration = { ...btcInput, id: "l-btc" };
const localLtc: Registration = { ...ltcInput, id: "l-ltc" };
const localBtcAccount = account("acc-l-btc", "bitcoin");
const ltcAccount = account("acc-ltc", "litecoin");
// The remote side holds a litecoin registration left from when litecoin was not local.
const remoteBtc: Registration = { ...btcInput, id: "r-btc" };
const remoteEvm: Registration = { ...evmInput, id: "r-evm" };
const remoteLtc: Registration = { ...ltcInput, id: "r-ltc" };
const btcAccount = account("acc-btc", "bitcoin");
const ethAccount = account("acc-eth", "ethereum");
const remoteLtcAccount = account("acc-r-ltc", "litecoin");

const localPortfolio: Portfolio = {
  id: "p1",
  registrations: [localBtc, localLtc],
  accounts: [localBtcAccount, ltcAccount],
};
const remotePortfolio: Portfolio = {
  id: "p1",
  registrations: [remoteBtc, remoteEvm, remoteLtc],
  accounts: [btcAccount, ethAccount, remoteLtcAccount],
};
const visiblePortfolio: Portfolio = {
  id: "p1",
  registrations: [localLtc, remoteBtc, remoteEvm],
  accounts: [ltcAccount, btcAccount, ethAccount],
};
const emptyPortfolio: Portfolio = { id: "p1", registrations: [], accounts: [] };

const update = (txHash: string, network: Network, time = "2026-01-01T00:00:00Z"): UpdateView => ({
  network,
  accountId: "acc",
  operation: {},
  time,
  txHash,
});
const balance = (account_id: string, network: Network): AccountBalances => ({
  type: "failure",
  network,
  account_id,
  error: "unavailable",
});
const point = (account_id: string, network: Network): BalanceHistoryPoint => ({
  network,
  account_id,
  asset: "native",
  time: "2026-01-01T00:00:00Z",
  value: "1",
});

let local: FakePortfolioApi & { sync: jest.Mock };
let remote: FakePortfolioApi;
let modeOf: jest.Mock<PortfolioMode, [Network]>;
let hybrid: HybridPortfolioApi;
let apis: Record<Side, FakePortfolioApi>;

beforeEach(() => {
  local = {
    ...fakePortfolioApi(["bitcoin", "ethereum", "litecoin"]),
    sync: jest.fn().mockResolvedValue("synced"),
  };
  remote = fakePortfolioApi(["ethereum", "solana", "bitcoin"]);
  apis = { local, remote };
  modeOf = jest.fn((network: Network): PortfolioMode => MODES[network] ?? "local");
  hybrid = createHybridPortfolio({ local, remote, modeOf });
});

const givenPortfolios = () => {
  local.getPortfolio.mockResolvedValue(localPortfolio);
  remote.getPortfolio.mockResolvedValue(remotePortfolio);
};

const askedNetworks = () => modeOf.mock.calls.map(([network]) => network).sort();

describe("getPortfolio", () => {
  it("answers what each network's read side holds, hiding the local twins", async () => {
    givenPortfolios();

    await expect(hybrid.getPortfolio("p1")).resolves.toEqual(visiblePortfolio);
  });

  it("asks the mode of each network once per call", async () => {
    givenPortfolios();

    await hybrid.getPortfolio("p1");
    expect(askedNetworks()).toEqual(["bitcoin", "ethereum", "litecoin"]);

    await hybrid.getPortfolio("p1");
    expect(modeOf).toHaveBeenCalledTimes(6);
  });

  it("follows an asynchronous mode", async () => {
    givenPortfolios();
    hybrid = createHybridPortfolio({ local, remote, modeOf: async network => MODES[network] });

    await expect(hybrid.getPortfolio("p1")).resolves.toEqual(visiblePortfolio);
  });

  it("serves one side when the other answers NOT_FOUND", async () => {
    local.getPortfolio.mockRejectedValue(notFound());
    remote.getPortfolio.mockResolvedValue(remotePortfolio);

    await expect(hybrid.getPortfolio("p1")).resolves.toEqual({
      id: "p1",
      registrations: [remoteBtc, remoteEvm],
      accounts: [btcAccount, ethAccount],
    });
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

describe("createPortfolio", () => {
  it("creates the portfolio on both sides and answers the visible part of both", async () => {
    local.createPortfolio.mockResolvedValue(localPortfolio);
    remote.createPortfolio.mockResolvedValue(remotePortfolio);

    await expect(hybrid.createPortfolio("p1")).resolves.toEqual(visiblePortfolio);
    expect(local.createPortfolio).toHaveBeenCalledWith("p1");
    expect(remote.createPortfolio).toHaveBeenCalledWith("p1");
  });

  it("asks the mode of each network once", async () => {
    local.createPortfolio.mockResolvedValue(localPortfolio);
    remote.createPortfolio.mockResolvedValue(remotePortfolio);

    await hybrid.createPortfolio("p1");

    expect(askedNetworks()).toEqual(["bitcoin", "ethereum", "litecoin"]);
  });
});

describe("addRegistrations", () => {
  it("registers each input on the sides of its network's mode, a hybrid one on both", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.addRegistrations.mockResolvedValue(remotePortfolio);

    await expect(
      hybrid.addRegistrations("p1", [btcInput, ltcInput, evmInput, solanaInput, tronInput]),
    ).resolves.toEqual(visiblePortfolio);
    expect(local.addRegistrations).toHaveBeenCalledWith("p1", [btcInput, ltcInput, tronInput]);
    expect(remote.addRegistrations).toHaveBeenCalledWith("p1", [btcInput, evmInput, solanaInput]);
  });

  it("asks the mode of each network once, registered and answered alike", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.addRegistrations.mockResolvedValue(remotePortfolio);

    await hybrid.addRegistrations("p1", [btcInput, { ...btcInput, xpub: "xpub-2" }, evmInput]);

    expect(askedNetworks()).toEqual(["bitcoin", "ethereum", "litecoin"]);
  });

  it("reads the portfolio of the side receiving no registration", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockResolvedValue(remotePortfolio);

    await expect(hybrid.addRegistrations("p1", [ltcInput])).resolves.toEqual(visiblePortfolio);
    expect(remote.addRegistrations).not.toHaveBeenCalled();
    expect(local.getPortfolio).not.toHaveBeenCalled();
  });

  it("counts a side not knowing the portfolio as empty", async () => {
    remote.addRegistrations.mockResolvedValue(remotePortfolio);
    local.getPortfolio.mockRejectedValue(notFound());

    await expect(hybrid.addRegistrations("p1", [evmInput])).resolves.toEqual({
      id: "p1",
      registrations: [remoteBtc, remoteEvm],
      accounts: [btcAccount, ethAccount],
    });
  });

  it("propagates the error of a side given registrations", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.addRegistrations.mockRejectedValue(new PortfolioApiError("UNAVAILABLE", "down"));

    await expect(hybrid.addRegistrations("p1", [btcInput])).rejects.toMatchObject({
      type: "UNAVAILABLE",
    });
    expect(local.addRegistrations).toHaveBeenCalledWith("p1", [btcInput]);
  });

  it("propagates NOT_FOUND from a side given registrations", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.addRegistrations.mockRejectedValue(notFound());

    await expect(hybrid.addRegistrations("p1", [btcInput])).rejects.toMatchObject({
      type: "NOT_FOUND",
    });
  });

  it("registers nothing and answers both sides when given no registration", async () => {
    givenPortfolios();

    await expect(hybrid.addRegistrations("p1", [])).resolves.toEqual(visiblePortfolio);
    expect(local.addRegistrations).not.toHaveBeenCalled();
    expect(remote.addRegistrations).not.toHaveBeenCalled();
  });

  it("answers the saved registration although the mode lookup of a network it brings fails", async () => {
    hybrid = createHybridPortfolio({
      local,
      remote,
      modeOf: network => {
        if (network === "polygon") throw new Error("no config");
        return "remote";
      },
    });
    remote.addRegistrations.mockResolvedValue({
      id: "p1",
      registrations: [remoteEvm],
      accounts: [ethAccount, account("acc-pol", "polygon")],
    });
    local.getPortfolio.mockRejectedValue(notFound());

    await expect(hybrid.addRegistrations("p1", [evmInput])).resolves.toEqual({
      id: "p1",
      registrations: [remoteEvm],
      accounts: [ethAccount],
    });
  });
});

describe("removeRegistrations", () => {
  it("removes each id on the side whose visible registrations hold it", async () => {
    givenPortfolios();
    local.removeRegistrations.mockResolvedValue({ ...localPortfolio, registrations: [localBtc] });
    remote.removeRegistrations.mockResolvedValue({
      ...remotePortfolio,
      registrations: [remoteBtc, remoteLtc],
    });

    await expect(hybrid.removeRegistrations("p1", ["r-evm", "l-ltc"])).resolves.toEqual({
      ...visiblePortfolio,
      registrations: [remoteBtc],
    });
    expect(local.removeRegistrations).toHaveBeenCalledWith("p1", ["l-ltc"]);
    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-evm"]);
  });

  it("removes the hidden local twin along with a hybrid registration", async () => {
    givenPortfolios();
    local.removeRegistrations.mockResolvedValue({ ...localPortfolio, registrations: [localLtc] });
    remote.removeRegistrations.mockResolvedValue({
      ...remotePortfolio,
      registrations: [remoteEvm, remoteLtc],
    });

    await expect(hybrid.removeRegistrations("p1", ["r-btc"])).resolves.toEqual({
      ...visiblePortfolio,
      registrations: [localLtc, remoteEvm],
    });
    expect(local.removeRegistrations).toHaveBeenCalledWith("p1", ["l-btc"]);
    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-btc"]);
  });

  it("removes a local registration and the twin of a hybrid one in one local call", async () => {
    givenPortfolios();
    local.removeRegistrations.mockResolvedValue({ ...localPortfolio, registrations: [] });
    remote.removeRegistrations.mockResolvedValue({
      ...remotePortfolio,
      registrations: [remoteEvm, remoteLtc],
    });

    await expect(hybrid.removeRegistrations("p1", ["r-btc", "l-ltc"])).resolves.toEqual({
      ...visiblePortfolio,
      registrations: [remoteEvm],
    });
    expect(local.removeRegistrations).toHaveBeenCalledTimes(1);
    expect(local.removeRegistrations).toHaveBeenCalledWith("p1", ["l-ltc", "l-btc"]);
    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-btc"]);
  });

  it("removes on the remote side before removing the twin", async () => {
    givenPortfolios();
    local.removeRegistrations.mockResolvedValue(localPortfolio);
    remote.removeRegistrations.mockResolvedValue(remotePortfolio);

    await hybrid.removeRegistrations("p1", ["r-btc"]);

    const [remoteCall] = remote.removeRegistrations.mock.invocationCallOrder;
    const [localCall] = local.removeRegistrations.mock.invocationCallOrder;
    expect(remoteCall).toBeLessThan(localCall);
  });

  it("keeps the local side as it is when the remote removal fails", async () => {
    givenPortfolios();
    remote.removeRegistrations.mockRejectedValue(new PortfolioApiError("UNAVAILABLE", "down"));

    await expect(hybrid.removeRegistrations("p1", ["r-btc", "l-ltc"])).rejects.toMatchObject({
      type: "UNAVAILABLE",
    });
    expect(local.removeRegistrations).not.toHaveBeenCalled();
  });

  it("keeps the twin of a registration the remote still holds under another id", async () => {
    const remoteBtcAgain: Registration = { ...btcInput, id: "r-btc-2" };
    local.getPortfolio.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockResolvedValue({
      ...remotePortfolio,
      registrations: [remoteBtc, remoteBtcAgain],
    });
    remote.removeRegistrations.mockResolvedValue({
      ...remotePortfolio,
      registrations: [remoteBtc],
    });

    await expect(hybrid.removeRegistrations("p1", ["r-btc-2"])).resolves.toEqual({
      ...visiblePortfolio,
      registrations: [localLtc, remoteBtc],
    });
    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-btc-2"]);
    expect(local.removeRegistrations).not.toHaveBeenCalled();
  });

  it("removes the twin along with every registration registering the same", async () => {
    const remoteBtcAgain: Registration = { ...btcInput, id: "r-btc-2" };
    local.getPortfolio.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockResolvedValue({
      ...remotePortfolio,
      registrations: [remoteBtc, remoteBtcAgain],
    });
    remote.removeRegistrations.mockResolvedValue({ ...remotePortfolio, registrations: [] });
    local.removeRegistrations.mockResolvedValue({ ...localPortfolio, registrations: [localLtc] });

    await hybrid.removeRegistrations("p1", ["r-btc", "r-btc-2"]);

    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-btc", "r-btc-2"]);
    expect(local.removeRegistrations).toHaveBeenCalledWith("p1", ["l-btc"]);
  });

  it.each<[string, Registration, Registration, Registration]>([
    [
      "auto_derive",
      { type: "auto_derive", id: "r", network: "bitcoin", xpub: "xpub" },
      { type: "auto_derive", id: "twin", network: "bitcoin", xpub: "xpub" },
      { type: "auto_derive", id: "other", network: "bitcoin", xpub: "xpub-2" },
    ],
    [
      "evm",
      { type: "evm", id: "r", address: "0xabc" },
      { type: "evm", id: "twin", address: "0xabc" },
      { type: "evm", id: "other", address: "0xABC" },
    ],
    [
      "solana",
      { type: "solana", id: "r", address: "So1" },
      { type: "solana", id: "twin", address: "So1" },
      { type: "solana", id: "other", address: "So2" },
    ],
    [
      "static",
      { type: "static", id: "r", network: "tron", addresses: ["T1", "T2"] },
      { type: "static", id: "twin", network: "tron", addresses: ["T2", "T1"] },
      { type: "static", id: "other", network: "tron", addresses: ["T1"] },
    ],
    [
      "cardano",
      {
        type: "cardano",
        id: "r",
        network: "cardano",
        external: ["e1", "e2"],
        internal: ["i1"],
        stake: ["s1"],
      },
      {
        type: "cardano",
        id: "twin",
        network: "cardano",
        external: ["e2", "e1"],
        internal: ["i1"],
        stake: ["s1"],
      },
      {
        type: "cardano",
        id: "other",
        network: "cardano",
        external: ["e1", "e2"],
        internal: ["i2"],
        stake: ["s1"],
      },
    ],
  ])(
    "finds the twin of a %s registration by what it registers",
    async (_, removed, twin, other) => {
      hybrid = createHybridPortfolio({ local, remote, modeOf: () => "hybrid" });
      local.getPortfolio.mockResolvedValue({ id: "p1", registrations: [other, twin] });
      remote.getPortfolio.mockResolvedValue({ id: "p1", registrations: [removed] });
      local.removeRegistrations.mockResolvedValue({ id: "p1", registrations: [other] });
      remote.removeRegistrations.mockResolvedValue({ id: "p1" });

      await expect(hybrid.removeRegistrations("p1", ["r"])).resolves.toEqual(emptyPortfolio);
      expect(local.removeRegistrations).toHaveBeenCalledWith("p1", ["twin"]);
      expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r"]);
    },
  );

  it("removes no local registration along with one of a remote network", async () => {
    const staleEvm: Registration = { ...evmInput, id: "l-evm" };
    local.getPortfolio.mockResolvedValue({
      ...localPortfolio,
      registrations: [staleEvm, localLtc],
    });
    remote.getPortfolio.mockResolvedValue(remotePortfolio);
    remote.removeRegistrations.mockResolvedValue({
      ...remotePortfolio,
      registrations: [remoteBtc, remoteLtc],
    });

    await expect(hybrid.removeRegistrations("p1", ["r-evm"])).resolves.toEqual({
      ...visiblePortfolio,
      registrations: [localLtc, remoteBtc],
    });
    expect(local.removeRegistrations).not.toHaveBeenCalled();
    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-evm"]);
  });

  it("sends a repeated id once", async () => {
    givenPortfolios();
    remote.removeRegistrations.mockResolvedValue(remotePortfolio);

    await hybrid.removeRegistrations("p1", ["r-evm", "r-evm"]);

    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-evm"]);
  });

  it("ignores the ids of hidden registrations and ids found nowhere", async () => {
    givenPortfolios();

    await expect(hybrid.removeRegistrations("p1", ["l-btc", "r-ltc", "unknown"])).resolves.toEqual(
      visiblePortfolio,
    );
    expect(local.removeRegistrations).not.toHaveBeenCalled();
    expect(remote.removeRegistrations).not.toHaveBeenCalled();
  });

  it("removes on the side knowing the portfolio when the other does not", async () => {
    local.getPortfolio.mockRejectedValue(notFound());
    remote.getPortfolio.mockResolvedValue(remotePortfolio);
    remote.removeRegistrations.mockResolvedValue({ id: "p1" });

    await expect(hybrid.removeRegistrations("p1", ["r-btc"])).resolves.toEqual(emptyPortfolio);
    expect(remote.removeRegistrations).toHaveBeenCalledWith("p1", ["r-btc"]);
  });

  it("answers NOT_FOUND when no side knows the portfolio", async () => {
    local.getPortfolio.mockRejectedValue(notFound());
    remote.getPortfolio.mockRejectedValue(notFound());

    await expect(hybrid.removeRegistrations("p1", ["r-btc"])).rejects.toMatchObject({
      type: "NOT_FOUND",
    });
  });

  it("asks the mode of each network once", async () => {
    givenPortfolios();
    local.removeRegistrations.mockResolvedValue(localPortfolio);
    remote.removeRegistrations.mockResolvedValue(remotePortfolio);

    await hybrid.removeRegistrations("p1", ["r-btc", "l-ltc"]);

    expect(askedNetworks()).toEqual(["bitcoin", "ethereum", "litecoin"]);
  });
});

describe("addAddresses", () => {
  const request = { type: "static", addresses: ["addr"] };

  it.each<[string, string, Side]>([
    ["local", "acc-ltc", "local"],
    ["hybrid", "acc-btc", "remote"],
    ["remote", "acc-eth", "remote"],
  ])(
    "sends the addresses of an account of a %s network (%s) to the %s side",
    async (_, accountId, side) => {
      givenPortfolios();
      apis[side].addAddresses.mockResolvedValue(account(accountId, "any"));

      await expect(hybrid.addAddresses("p1", accountId, request)).resolves.toEqual(
        account(accountId, "any"),
      );
      expect(apis[side].addAddresses).toHaveBeenCalledWith("p1", accountId, request);
    },
  );

  it("asks the mode of each network once", async () => {
    givenPortfolios();
    remote.addAddresses.mockResolvedValue(btcAccount);

    await hybrid.addAddresses("p1", "acc-btc", request);

    expect(askedNetworks()).toEqual(["bitcoin", "ethereum", "litecoin"]);
  });

  it("sends to the visible account when both sides hold the id", async () => {
    local.getPortfolio.mockResolvedValue({ id: "p1", accounts: [account("shared", "bitcoin")] });
    remote.getPortfolio.mockResolvedValue({ id: "p1", accounts: [account("shared", "bitcoin")] });
    remote.addAddresses.mockResolvedValue(account("shared", "bitcoin"));

    await hybrid.addAddresses("p1", "shared", request);

    expect(remote.addAddresses).toHaveBeenCalledWith("p1", "shared", request);
    expect(local.addAddresses).not.toHaveBeenCalled();
  });

  it.each(["acc-l-btc", "acc-r-ltc", "unknown"])(
    "answers NOT_FOUND for %s, held visibly by no side",
    async accountId => {
      givenPortfolios();

      await expect(hybrid.addAddresses("p1", accountId, request)).rejects.toMatchObject({
        type: "NOT_FOUND",
        message: `Account ${accountId} not found`,
      });
      expect(local.addAddresses).not.toHaveBeenCalled();
      expect(remote.addAddresses).not.toHaveBeenCalled();
    },
  );
});

type ReadMethod = "getUpdates" | "getPortfolioBalance" | "getPortfolioBalanceHistory";
type ReadItem = { network: Network };

const READS: [ReadMethod, (id: string, network: Network) => ReadItem][] = [
  ["getUpdates", (id, network) => update(id, network)],
  ["getPortfolioBalance", balance],
  ["getPortfolioBalanceHistory", point],
];

const read = (api: PortfolioApi, method: ReadMethod, query?: Record<string, unknown>) =>
  (api[method] as (portfolioId: string, query?: unknown) => Promise<PageView<ReadItem>>)(
    "p1",
    query,
  );

describe.each(READS)("%s", (method, item) => {
  const givenPages = (pages: Record<Side, PageView<ReadItem>>) => {
    local[method].mockResolvedValue(pages.local as never);
    remote[method].mockResolvedValue(pages.remote as never);
  };

  it("answers the items each side serves the reads of, local first", async () => {
    givenPages({
      local: { items: [item("l-btc", "bitcoin"), item("l-ltc", "litecoin")] },
      remote: {
        items: [item("r-btc", "bitcoin"), item("r-ltc", "litecoin"), item("r-eth", "ethereum")],
      },
    });

    await expect(read(hybrid, method)).resolves.toEqual({
      items: [item("l-ltc", "litecoin"), item("r-btc", "bitcoin"), item("r-eth", "ethereum")],
    });
    expect(local[method]).toHaveBeenCalledWith("p1", {});
    expect(remote[method]).toHaveBeenCalledWith("p1", {});
  });

  it("asks the mode of each network once across both pages", async () => {
    givenPages({
      local: { items: [item("l-btc", "bitcoin"), item("l-ltc", "litecoin")] },
      remote: { items: [item("r-btc", "bitcoin"), item("r-ltc", "litecoin")] },
    });

    await read(hybrid, method);

    expect(askedNetworks()).toEqual(["bitcoin", "litecoin"]);
  });

  it("keeps each side's token, and passes the other query fields through", async () => {
    givenPages({ local: { items: [], nextToken: "l2" }, remote: { items: [] } });

    const page = await read(hybrid, method, { size: 5, order: "ASC" });

    expect(decodeCursors(page.nextToken!)).toEqual({ local: "l2", remote: null });
    expect(local[method]).toHaveBeenCalledWith("p1", { size: 5, order: "ASC" });
  });

  it("continues each side still going from its own token", async () => {
    local[method]
      .mockResolvedValueOnce({ items: [], nextToken: "l2" } as never)
      .mockResolvedValueOnce({ items: [item("l-ltc", "litecoin")] } as never);
    remote[method].mockResolvedValue({ items: [] } as never);

    const first = await read(hybrid, method, { size: 5 });
    const second = await read(hybrid, method, { size: 5, token: first.nextToken });

    expect(second).toEqual({ items: [item("l-ltc", "litecoin")] });
    expect(local[method]).toHaveBeenNthCalledWith(2, "p1", { size: 5, token: "l2" });
    expect(remote[method]).toHaveBeenCalledTimes(1);
  });

  it("reads one side while the other answers NOT_FOUND", async () => {
    local[method].mockRejectedValue(notFound());
    remote[method].mockResolvedValue({ items: [item("r-eth", "ethereum")] } as never);

    await expect(read(hybrid, method)).resolves.toEqual({ items: [item("r-eth", "ethereum")] });
  });

  it.each<[PortfolioMode, Network, Side]>([
    ["local", "litecoin", "local"],
    ["hybrid", "bitcoin", "remote"],
    ["remote", "ethereum", "remote"],
  ])("reads a %s network (%s) filtered on from the %s side", async (_, network, side) => {
    apis[side][method].mockResolvedValue({ items: [item("a", network)] } as never);

    await expect(read(hybrid, method, { network })).resolves.toEqual({
      items: [item("a", network)],
    });
    expect(apis[side][method]).toHaveBeenCalledWith("p1", { network });
    expect(apis[side === "local" ? "remote" : "local"][method]).not.toHaveBeenCalled();
    expect(modeOf).toHaveBeenCalledTimes(1);
  });

  it.each<[string, Side]>([
    ["acc-ltc", "local"],
    ["acc-btc", "remote"],
    ["acc-eth", "remote"],
  ])("reads the account %s filtered on from %s, the side holding it visibly", async (id, side) => {
    givenPortfolios();
    apis[side][method].mockResolvedValue({} as never);

    await read(hybrid, method, { account: id });

    expect(apis[side][method]).toHaveBeenCalledWith("p1", { account: id });
    expect(apis[side === "local" ? "remote" : "local"][method]).not.toHaveBeenCalled();
  });

  it("asks the mode of each network once, finding the account and filtering its items", async () => {
    givenPortfolios();
    remote[method].mockResolvedValue({ items: [item("r-btc", "bitcoin")] } as never);

    await expect(read(hybrid, method, { account: "acc-btc" })).resolves.toEqual({
      items: [item("r-btc", "bitcoin")],
    });
    expect(askedNetworks()).toEqual(["bitcoin", "ethereum", "litecoin"]);
  });

  it("reads the side holding the account rather than the read side of a network filter", async () => {
    givenPortfolios();
    local[method].mockResolvedValue({ items: [item("l-ltc", "litecoin")] } as never);
    const query = { account: "acc-ltc", network: "bitcoin" };

    await expect(read(hybrid, method, query)).resolves.toEqual({
      items: [item("l-ltc", "litecoin")],
    });
    expect(local[method]).toHaveBeenCalledWith("p1", query);
    expect(remote[method]).not.toHaveBeenCalled();
  });

  it.each<[string, Record<string, string>]>([
    ["acc-l-btc", {}],
    ["unknown", {}],
    ["unknown", { network: "bitcoin" }],
  ])(
    "answers NOT_FOUND for the account %s, held visibly by no side, filtered on with %j",
    async (account, filter) => {
      givenPortfolios();

      await expect(read(hybrid, method, { ...filter, account })).rejects.toMatchObject({
        type: "NOT_FOUND",
      });
      expect(local[method]).not.toHaveBeenCalled();
      expect(remote[method]).not.toHaveBeenCalled();
    },
  );

  it("answers BAD_REQUEST for a malformed token without reading any side", async () => {
    await expect(read(hybrid, method, { token: "not a token" })).rejects.toMatchObject({
      type: "BAD_REQUEST",
    });
    expect(local[method]).not.toHaveBeenCalled();
    expect(remote[method]).not.toHaveBeenCalled();
  });
});

describe("getUpdates", () => {
  it("merges a page of each side, most recent first, then continues each side", async () => {
    local.getUpdates.mockResolvedValueOnce({
      items: [update("l1", "litecoin", "2026-01-02T00:00:00Z")],
    });
    remote.getUpdates
      .mockResolvedValueOnce({
        items: [
          update("r1", "bitcoin", "2026-01-03T00:00:00Z"),
          update("r2", "ethereum", "2026-01-01T00:00:00Z"),
        ],
        nextToken: "remote-2",
      })
      .mockResolvedValueOnce({ items: [update("r3", "bitcoin", "2025-12-31T00:00:00Z")] });

    const first = await hybrid.getUpdates("p1", { size: 2 });
    const second = await hybrid.getUpdates("p1", { size: 2, token: first.nextToken! });

    expect(first.items!.map(({ txHash }) => txHash)).toEqual(["r1", "l1", "r2"]);
    expect(local.getUpdates).toHaveBeenCalledTimes(1);
    expect(remote.getUpdates).toHaveBeenNthCalledWith(2, "p1", { size: 2, token: "remote-2" });
    expect(second).toEqual({ items: [update("r3", "bitcoin", "2025-12-31T00:00:00Z")] });
  });

  it("sorts the merged page oldest first in ASC order", async () => {
    local.getUpdates.mockResolvedValue({
      items: [update("l1", "litecoin", "2026-01-02T00:00:00Z")],
    });
    remote.getUpdates.mockResolvedValue({
      items: [update("r1", "bitcoin", "2026-01-01T00:00:00Z")],
    });

    const page = await hybrid.getUpdates("p1", { order: "ASC" });

    expect(page.items!.map(({ txHash }) => txHash)).toEqual(["r1", "l1"]);
  });

  it("reads both sides from the start without a query", async () => {
    local.getUpdates.mockResolvedValue({});
    remote.getUpdates.mockResolvedValue({});

    await expect(hybrid.getUpdates("p1")).resolves.toEqual({ items: [] });
    expect(local.getUpdates).toHaveBeenCalledWith("p1", {});
    expect(remote.getUpdates).toHaveBeenCalledWith("p1", {});
  });
});

describe("getPortfolioBalance", () => {
  it("reads both sides from the start without a query", async () => {
    local.getPortfolioBalance.mockResolvedValue({});
    remote.getPortfolioBalance.mockResolvedValue({});

    await expect(hybrid.getPortfolioBalance("p1")).resolves.toEqual({ items: [] });
    expect(remote.getPortfolioBalance).toHaveBeenCalledWith("p1", {});
  });
});

describe("getPortfolioBalanceHistory", () => {
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
    ]);
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
const NETWORK_READS: [NetworkMethod, unknown[]][] = [
  ["getLastBlock", []],
  ["getValidators", [{ cursor: "c1" }]],
];
const WRITES: [NetworkMethod, unknown[]][] = [
  ["validateAddress", ["addr", { networkId: 1 }]],
  ["validateAddress", ["addr", undefined]],
  ["getNextSequence", ["addr"]],
  ["estimateTransactionFee", [{ intent }]],
  ["encodeTransaction", [{ intent, customFees: "10" }]],
  ["combineTransaction", [{ rawTransaction: "raw", signature: "sig" }]],
  ["broadcastTransaction", [{ signedTransaction: "signed" }]],
];

const MODE_SIDES: { mode: PortfolioMode; network: Network; read: Side; write: Side }[] = [
  { mode: "local", network: "litecoin", read: "local", write: "local" },
  { mode: "hybrid", network: "bitcoin", read: "remote", write: "local" },
  { mode: "remote", network: "ethereum", read: "remote", write: "remote" },
];
const other = (side: Side): Side => (side === "local" ? "remote" : "local");

describe.each(MODE_SIDES)("a $mode network", ({ network, read, write }) => {
  it.each(NETWORK_READS)(`reads %s on ${read}`, async (method, args) => {
    apis[read][method].mockResolvedValue("answer" as never);

    await expect(call(hybrid, method, [network, ...args])).resolves.toBe("answer");
    expect(apis[read][method]).toHaveBeenCalledWith(network, ...args);
    expect(apis[other(read)][method]).not.toHaveBeenCalled();
    expect(modeOf).toHaveBeenCalledTimes(1);
  });

  it.each(WRITES)(`writes %s on ${write}`, async (method, args) => {
    apis[write][method].mockResolvedValue("answer" as never);

    await expect(call(hybrid, method, [network, ...args])).resolves.toBe("answer");
    expect(apis[write][method]).toHaveBeenCalledWith(network, ...args);
    expect(apis[other(write)][method]).not.toHaveBeenCalled();
    expect(modeOf).toHaveBeenCalledTimes(1);
  });
});

type Extension = {
  [K in keyof PortfolioApi]-?: undefined extends PortfolioApi[K] ? K : never;
}[keyof PortfolioApi];

/** Gives `api` the extension `name`, answering `answer`. */
const serve = (api: FakePortfolioApi, name: Extension, answer: unknown = `${name} answer`) => {
  const method = jest.fn().mockResolvedValue(answer);
  (api as Record<string, unknown>)[name] = method;
  return method;
};

const callExtension = (name: Extension, args: unknown[]) =>
  (hybrid[name] as (...args: unknown[]) => Promise<unknown>)(...args);

const NETWORK_EXTENSIONS: [Extension, unknown[]][] = [
  ["getAccountInfo", ["addr"]],
  ["call", [{ params: { to: "0xc", data: "0x" } }]],
  ["getAddressesForPublicKey", ["pubkey"]],
  ["getTransactionInfo", ["0xhash"]],
];
const WRITE_EXTENSIONS: [Extension, unknown[]][] = [
  ["validateTransaction", [{ intent, customFees: "1" }]],
  [
    "encodeRawTransaction",
    [{ transaction: "raw", sender: "addr", senderPublicKey: "pk", sequence: "1" }],
  ],
];
const ACCOUNT_EXTENSIONS: Extension[] = [
  "getFreshAddress",
  "getChangeAddress",
  "getAccountAddresses",
  "getAccountUtxos",
];

describe.each(NETWORK_EXTENSIONS)("the network extension %s", (name, args) => {
  it("goes to the read side when it serves it, bound to it", async () => {
    const remoteMethod = serve(remote, name);
    const localMethod = serve(local, name);

    await expect(callExtension(name, ["bitcoin", ...args])).resolves.toBe(`${name} answer`);
    expect(remoteMethod).toHaveBeenCalledWith("bitcoin", ...args);
    expect(remoteMethod.mock.contexts[0]).toBe(remote);
    expect(localMethod).not.toHaveBeenCalled();
    expect(modeOf).toHaveBeenCalledTimes(1);
  });

  it("goes to the write side when the read side does not serve it", async () => {
    const localMethod = serve(local, name);

    await expect(callExtension(name, ["bitcoin", ...args])).resolves.toBe(`${name} answer`);
    expect(localMethod).toHaveBeenCalledWith("bitcoin", ...args);
    expect(localMethod.mock.contexts[0]).toBe(local);
  });

  it("is never retried on the write side once the read side fails", async () => {
    const failure = new PortfolioApiError("UNAVAILABLE", "down");
    serve(remote, name).mockRejectedValue(failure);
    const localMethod = serve(local, name);

    await expect(callExtension(name, ["bitcoin", ...args])).rejects.toBe(failure);
    expect(localMethod).not.toHaveBeenCalled();
  });

  it("answers METHOD_NOT_ALLOWED when neither side of the network serves it", async () => {
    const localMethod = serve(local, name);

    await expect(callExtension(name, ["ethereum", ...args])).rejects.toThrow(
      new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} is not served for ethereum`),
    );
    expect(localMethod).not.toHaveBeenCalled();
  });
});

describe.each(WRITE_EXTENSIONS)("the write extension %s", (name, args) => {
  it("goes to the write side, bound to it", async () => {
    const localMethod = serve(local, name);
    const remoteMethod = serve(remote, name);

    await expect(callExtension(name, ["bitcoin", ...args])).resolves.toBe(`${name} answer`);
    expect(localMethod).toHaveBeenCalledWith("bitcoin", ...args);
    expect(localMethod.mock.contexts[0]).toBe(local);
    expect(remoteMethod).not.toHaveBeenCalled();
    expect(modeOf).toHaveBeenCalledTimes(1);
  });

  it("answers METHOD_NOT_ALLOWED when the write side does not serve it", async () => {
    const localMethod = serve(local, name);
    serve(remote, "getAccountInfo");

    await expect(callExtension(name, ["ethereum", ...args])).rejects.toThrow(
      new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} is not served for ethereum`),
    );
    expect(localMethod).not.toHaveBeenCalled();
  });
});

describe.each(ACCOUNT_EXTENSIONS)("the account extension %s", name => {
  it("goes to the side holding the account, a hidden twin included", async () => {
    givenPortfolios();
    const localMethod = serve(local, name);
    const remoteMethod = serve(remote, name);

    await expect(callExtension(name, ["p1", "acc-l-btc"])).resolves.toBe(`${name} answer`);
    await expect(callExtension(name, ["p1", "acc-eth"])).resolves.toBe(`${name} answer`);
    expect(localMethod.mock.calls).toEqual([["p1", "acc-l-btc"]]);
    expect(localMethod.mock.contexts[0]).toBe(local);
    expect(remoteMethod.mock.calls).toEqual([["p1", "acc-eth"]]);
    expect(remoteMethod.mock.contexts[0]).toBe(remote);
  });

  it("answers METHOD_NOT_ALLOWED when the side holding the account does not serve it", async () => {
    givenPortfolios();
    const localMethod = serve(local, name);

    await expect(callExtension(name, ["p1", "acc-btc"])).rejects.toThrow(
      new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} is not served for account acc-btc`),
    );
    expect(localMethod).not.toHaveBeenCalled();
  });

  it("reads an account the local side holds without the remote side, which may be down", async () => {
    local.getPortfolio.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockRejectedValue(new TypeError("fetch failed"));
    const localMethod = serve(local, name);
    const remoteMethod = serve(remote, name);

    await expect(callExtension(name, ["p1", "acc-l-btc"])).resolves.toBe(`${name} answer`);
    expect(localMethod).toHaveBeenCalledWith("p1", "acc-l-btc");
    expect(remote.getPortfolio).not.toHaveBeenCalled();
    expect(remoteMethod).not.toHaveBeenCalled();
  });

  it("fails as the remote side does when the local side does not hold the account", async () => {
    const failure = new TypeError("fetch failed");
    local.getPortfolio.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockRejectedValue(failure);
    const localMethod = serve(local, name);

    await expect(callExtension(name, ["p1", "acc-eth"])).rejects.toBe(failure);
    expect(localMethod).not.toHaveBeenCalled();
  });

  it("finds the account on the side knowing the portfolio when the other does not", async () => {
    local.getPortfolio.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockRejectedValue(notFound());
    const localMethod = serve(local, name);

    await expect(callExtension(name, ["p1", "acc-ltc"])).resolves.toBe(`${name} answer`);
    expect(localMethod).toHaveBeenCalledWith("p1", "acc-ltc");
  });

  it("answers NOT_FOUND for an account no side holds, or a portfolio no side knows", async () => {
    givenPortfolios();
    serve(local, name);

    await expect(callExtension(name, ["p1", "unknown"])).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Account unknown not found"),
    );
    local.getPortfolio.mockRejectedValue(notFound());
    remote.getPortfolio.mockRejectedValue(notFound());
    await expect(callExtension(name, ["p1", "acc-l-btc"])).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Portfolio p1 not found"),
    );
  });
});

describe("extension fields", () => {
  it("pass through portfolios and pages unchanged", async () => {
    const failed = { ...btcAccount, error: { name: "UnexpectedGetBalanceError", message: "" } };
    local.getPortfolio.mockResolvedValue(emptyPortfolio);
    remote.getPortfolio.mockResolvedValue({ ...remotePortfolio, accounts: [failed] });
    const entry = {
      network: "bitcoin",
      account_id: "acc-btc",
      asset: "native",
      name: "Bitcoin",
      ticker: "BTC",
      decimals: 8,
      amount: "1",
      estimated: false,
      status: "confirmed" as const,
      locked: false,
      asset_info: { type: "native" },
      balance_index: 0,
    };
    const balances: AccountBalances = {
      type: "success",
      network: "bitcoin",
      account_id: "acc-btc",
      items: [entry],
    };
    local.getPortfolioBalance.mockResolvedValue({ items: [] });
    remote.getPortfolioBalance.mockResolvedValue({ items: [balances] });

    expect((await hybrid.getPortfolio("p1")).accounts).toEqual([failed]);
    expect((await hybrid.getPortfolioBalance("p1")).items).toEqual([balances]);
  });
});

describe("network operations", () => {
  it("follow a mode that changed since the last call", async () => {
    local.getLastBlock.mockResolvedValue({ height: 1 });
    remote.getLastBlock.mockResolvedValue({ height: 2 });
    modeOf.mockReturnValueOnce("local").mockReturnValueOnce("remote");

    await expect(hybrid.getLastBlock("bitcoin")).resolves.toEqual({ height: 1 });
    await expect(hybrid.getLastBlock("bitcoin")).resolves.toEqual({ height: 2 });
  });

  it("follow an asynchronous mode", async () => {
    hybrid = createHybridPortfolio({
      local,
      remote,
      modeOf: async (): Promise<PortfolioMode> => "hybrid",
    });
    remote.getLastBlock.mockResolvedValue({ height: 1 });
    local.broadcastTransaction.mockResolvedValue({ transactionId: "tx" });

    await expect(hybrid.getLastBlock("bitcoin")).resolves.toEqual({ height: 1 });
    await expect(
      hybrid.broadcastTransaction("bitcoin", { signedTransaction: "signed" }),
    ).resolves.toEqual({ transactionId: "tx" });
  });
});

describe("without a modeOf", () => {
  beforeEach(() => {
    hybrid = createHybridPortfolio({ local, remote });
  });

  it("answers only the local side of a portfolio", async () => {
    givenPortfolios();

    await expect(hybrid.getPortfolio("p1")).resolves.toEqual({
      id: "p1",
      registrations: localPortfolio.registrations,
      accounts: localPortfolio.accounts,
    });
  });

  it("registers everything locally", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockResolvedValue(remotePortfolio);

    await hybrid.addRegistrations("p1", [btcInput, evmInput]);

    expect(local.addRegistrations).toHaveBeenCalledWith("p1", [btcInput, evmInput]);
    expect(remote.addRegistrations).not.toHaveBeenCalled();
  });

  it("reads and writes every network locally", async () => {
    local.getLastBlock.mockResolvedValue({ height: 1 });
    local.encodeTransaction.mockResolvedValue({ rawTransaction: "raw" });

    await hybrid.getLastBlock("ethereum");
    await hybrid.encodeTransaction("ethereum", { intent });

    expect(remote.getLastBlock).not.toHaveBeenCalled();
    expect(remote.encodeTransaction).not.toHaveBeenCalled();
  });
});

describe.each<[string, ModeOf]>([
  [
    "fails",
    () => {
      throw new Error("no config");
    },
  ],
  ["answers an unknown mode", () => "Remote" as PortfolioMode],
])("a network whose mode lookup %s", (_, lookup) => {
  beforeEach(() => {
    hybrid = createHybridPortfolio({ local, remote, modeOf: lookup });
  });

  it("is local in a portfolio", async () => {
    givenPortfolios();

    await expect(hybrid.getPortfolio("p1")).resolves.toEqual({
      id: "p1",
      registrations: localPortfolio.registrations,
      accounts: localPortfolio.accounts,
    });
  });

  it("is registered locally", async () => {
    local.addRegistrations.mockResolvedValue(localPortfolio);
    remote.getPortfolio.mockResolvedValue(remotePortfolio);

    await hybrid.addRegistrations("p1", [evmInput]);

    expect(local.addRegistrations).toHaveBeenCalledWith("p1", [evmInput]);
    expect(remote.addRegistrations).not.toHaveBeenCalled();
  });

  it("is read and written locally", async () => {
    local.getLastBlock.mockResolvedValue({ height: 1 });
    local.encodeTransaction.mockResolvedValue({ rawTransaction: "raw" });

    await expect(hybrid.getLastBlock("ethereum")).resolves.toEqual({ height: 1 });
    await expect(hybrid.encodeTransaction("ethereum", { intent })).resolves.toEqual({
      rawTransaction: "raw",
    });
    expect(remote.getLastBlock).not.toHaveBeenCalled();
    expect(remote.encodeTransaction).not.toHaveBeenCalled();
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
