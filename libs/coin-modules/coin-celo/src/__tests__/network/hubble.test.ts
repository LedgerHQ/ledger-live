const networkMock = jest.fn();
const getCeloClientMock = jest.fn();
const getRegistryAddressForMock = jest.fn();
const readContractMock = jest.fn();
const multicallMock = jest.fn();

jest.mock("@ledgerhq/live-network/network", () => ({
  __esModule: true,
  default: (...args: unknown[]) => networkMock(...args),
}));
jest.mock("../../network/client", () => ({
  getCeloClient: (...args: unknown[]) => getCeloClientMock(...args),
}));
jest.mock("../../network/registry", () => ({
  getRegistryAddressFor: (...args: unknown[]) => getRegistryAddressForMock(...args),
}));

import { getValidatorGroups } from "../../network/hubble";

const FIGMENT = "0x0861a61Bf679A30680510EcC238ee43B82C5e843";

type Group = {
  address: string;
  name: string;
  cap: bigint; // getNumVotesReceivable (vote cap)
  total: bigint; // getTotalVotesForGroup
  eligible: boolean;
};

const setup = (groups: Group[]) => {
  networkMock.mockResolvedValue({
    data: {
      items: groups.map(g => ({
        address: g.address,
        name: g.name,
        active_votes: g.total.toString(),
        pending_votes: "0",
      })),
    },
  });

  readContractMock.mockImplementation(async ({ functionName }: { functionName: string }) => {
    if (functionName === "getEligibleValidatorGroups") {
      return groups.filter(g => g.eligible).map(g => g.address);
    }
    return 0n;
  });

  // getValidatorGroups batches the per-group capacity reads via client.multicall, in the order
  // [getNumVotesReceivable, getTotalVotesForGroup] for each raw group.
  multicallMock.mockImplementation(async () =>
    groups.flatMap(g => [
      { status: "success", result: g.cap },
      { status: "success", result: g.total },
    ]),
  );
};

describe("network/hubble - getValidatorGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getCeloClientMock.mockReturnValue({ readContract: readContractMock, multicall: multicallMock });
    getRegistryAddressForMock.mockResolvedValue("0x000000000000000000000000000000000000ce10");
  });

  it("keeps eligible groups that still have capacity, ranked by TVL", async () => {
    setup([
      { address: "0xaaa", name: "Alpha", cap: 1000n, total: 100n, eligible: true },
      { address: "0xbbb", name: "Beta", cap: 1000n, total: 300n, eligible: true },
    ]);

    const result = await getValidatorGroups();

    expect(result.map(g => g.name)).toEqual(["Beta", "Alpha"]);
  });

  it("filters out saturated groups (cap <= total) so they are not offered", async () => {
    setup([
      { address: "0xaaa", name: "Alpha", cap: 1000n, total: 100n, eligible: true },
      { address: "0xsat", name: "Saturated", cap: 100n, total: 500n, eligible: true },
    ]);

    const result = await getValidatorGroups();

    expect(result.map(g => g.name)).toEqual(["Alpha"]);
  });

  it("filters out groups that are not in the eligible set", async () => {
    setup([
      { address: "0xaaa", name: "Alpha", cap: 1000n, total: 100n, eligible: true },
      { address: "0xine", name: "Ineligible", cap: 1000n, total: 100n, eligible: false },
    ]);

    const result = await getValidatorGroups();

    expect(result.map(g => g.name)).toEqual(["Alpha"]);
  });

  it("keeps eligible groups when the capacity multicall fails (fail open)", async () => {
    setup([
      { address: "0xaaa", name: "Alpha", cap: 1000n, total: 100n, eligible: true },
      { address: "0xbbb", name: "Beta", cap: 1000n, total: 300n, eligible: true },
      { address: "0xine", name: "Ineligible", cap: 1000n, total: 100n, eligible: false },
    ]);
    multicallMock.mockRejectedValueOnce(new Error("rpc down"));

    const result = await getValidatorGroups();

    expect(result.map(g => g.name)).toEqual(["Beta", "Alpha"]);
  });

  it("keeps a group when one of its two capacity reads fails (fail open)", async () => {
    setup([{ address: "0xaaa", name: "Alpha", cap: 1000n, total: 100n, eligible: true }]);
    // getNumVotesReceivable succeeds, getTotalVotesForGroup fails for the only group.
    multicallMock.mockResolvedValueOnce([
      { status: "success", result: 1000n },
      { status: "failure", error: new Error("revert") },
    ]);

    const result = await getValidatorGroups();

    expect(result.map(g => g.name)).toEqual(["Alpha"]);
  });

  it("excludes the deprecated 'Ledger by Figment' group even when it has capacity", async () => {
    setup([
      { address: "0xaaa", name: "Alpha", cap: 1000n, total: 100n, eligible: true },
      { address: FIGMENT, name: "Ledger by Figment", cap: 999999n, total: 0n, eligible: true },
    ]);

    const result = await getValidatorGroups();

    expect(result.map(g => g.name)).toEqual(["Alpha"]);
  });
});
