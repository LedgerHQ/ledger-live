import type { Portfolio, PortfolioMode } from "@ledgerhq/portfolio-module-framework";
import { memoizeModes } from "./modes";
import { visibleOn, visiblePortfolios } from "./visibility";

const MODES: Record<string, PortfolioMode> = {
  bitcoin: "hybrid",
  ethereum: "remote",
  litecoin: "local",
};
const modeOf = jest.fn((network: string): PortfolioMode => MODES[network] ?? "local");

beforeEach(() => modeOf.mockClear());

describe("visibleOn", () => {
  const items = [
    { network: "bitcoin", id: 1 },
    { network: "litecoin", id: 2 },
    { network: "ethereum", id: 3 },
    { network: "bitcoin", id: 4 },
  ];
  const networkOf = ({ network }: { network: string }) => network;

  it("keeps on the local side the items of local networks only", async () => {
    await expect(visibleOn("local", items, networkOf, memoizeModes(modeOf))).resolves.toEqual([
      items[1],
    ]);
  });

  it("keeps on the remote side the items of remote and hybrid networks, in order", async () => {
    await expect(visibleOn("remote", items, networkOf, memoizeModes(modeOf))).resolves.toEqual([
      items[0],
      items[2],
      items[3],
    ]);
  });

  it("keeps nothing of no items", async () => {
    await expect(visibleOn("local", [], networkOf, memoizeModes(modeOf))).resolves.toEqual([]);
    expect(modeOf).not.toHaveBeenCalled();
  });
});

describe("visiblePortfolios", () => {
  const portfolio = (id: string): Portfolio => ({
    id,
    registrations: [
      { type: "auto_derive", id: `${id}-btc`, network: "bitcoin", xpub: "xpub" },
      { type: "auto_derive", id: `${id}-ltc`, network: "litecoin", xpub: "xpub" },
      { type: "evm", id: `${id}-evm`, address: "0xabc" },
    ],
    accounts: [
      { id: `${id}-btc`, network: "bitcoin", status: "synchronized" },
      { id: `${id}-ltc`, network: "litecoin", status: "synchronized" },
      { id: `${id}-eth`, network: "ethereum", status: "synchronized" },
    ],
  });

  it("cuts each side to the registrations and accounts it serves the reads of", async () => {
    const local = portfolio("local");
    const remote = portfolio("remote");

    await expect(visiblePortfolios({ local, remote }, memoizeModes(modeOf))).resolves.toEqual({
      local: {
        id: "local",
        registrations: [local.registrations![1]],
        accounts: [local.accounts![1]],
      },
      remote: {
        id: "remote",
        registrations: [remote.registrations![0], remote.registrations![2]],
        accounts: [remote.accounts![0], remote.accounts![2]],
      },
    });
  });

  it("asks the mode of each network once across both sides", async () => {
    await visiblePortfolios(
      { local: portfolio("local"), remote: portfolio("remote") },
      memoizeModes(modeOf),
    );

    expect(modeOf.mock.calls).toEqual([["bitcoin"], ["litecoin"], ["ethereum"]]);
  });

  it("keeps a side not knowing the portfolio unknown, and an empty one empty", async () => {
    await expect(
      visiblePortfolios({ local: undefined, remote: { id: "p1" } }, memoizeModes(modeOf)),
    ).resolves.toEqual({ local: undefined, remote: { id: "p1", registrations: [], accounts: [] } });
  });
});
