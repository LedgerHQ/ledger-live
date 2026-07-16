jest.mock("../../network/client", () => ({ getCeloClient: jest.fn() }));

import { getCeloClient } from "../../network/client";
import { getVoteNeighbors } from "../../network/voteNeighbors";

const ELECTION = "0x3333333333333333333333333333333333333333" as `0x${string}`;
const A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`;
const B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as `0x${string}`;
const T = "0xcccccccccccccccccccccccccccccccccccccccc" as `0x${string}`;
const ZERO = "0x0000000000000000000000000000000000000000";

const mockReadContract = (impl: () => unknown) => {
  (getCeloClient as jest.Mock).mockReturnValue({ readContract: jest.fn(impl) });
};

describe("getVoteNeighbors", () => {
  beforeEach(() => (getCeloClient as jest.Mock).mockReset());

  it("places a new group between its lesser and greater neighbors by vote total", async () => {
    // A has 10 votes, B has 30; adding 20 to a new group T lands it between them.
    mockReadContract(() => [
      [A, B],
      [10n, 30n],
    ]);

    const { lesser, greater } = await getVoteNeighbors(ELECTION, T, 20n, true);

    expect(lesser.toLowerCase()).toBe(A.toLowerCase());
    expect(greater.toLowerCase()).toBe(B.toLowerCase());
  });

  it("returns the highest group as lesser and zero as greater when the new total tops the list", async () => {
    mockReadContract(() => [
      [A, B],
      [10n, 30n],
    ]);

    const { lesser, greater } = await getVoteNeighbors(ELECTION, T, 100n, true);

    expect(lesser.toLowerCase()).toBe(B.toLowerCase());
    expect(greater).toBe(ZERO);
  });

  it("resolves both neighbors to the zero address when the eligible list reverts/empty", async () => {
    mockReadContract(() => {
      throw new Error("execution reverted");
    });

    const { lesser, greater } = await getVoteNeighbors(ELECTION, T, 5n, true);

    expect(lesser).toBe(ZERO);
    expect(greater).toBe(ZERO);
  });

  it("rethrows a transient RPC error instead of silently yielding zero neighbors", async () => {
    mockReadContract(() => {
      throw new Error("HttpRequestError: connection timeout");
    });

    await expect(getVoteNeighbors(ELECTION, T, 5n, true)).rejects.toThrow(/timeout/);
  });

  it("recomputes neighbors for a revoke (subtracting votes) on an existing group", async () => {
    // T currently holds 50; revoking 30 leaves 20 → lands between A(10) and B(30)
    mockReadContract(() => [
      [A, T, B],
      [10n, 50n, 30n],
    ]);

    const { lesser, greater } = await getVoteNeighbors(ELECTION, T, 30n, false);

    expect(lesser.toLowerCase()).toBe(A.toLowerCase());
    expect(greater.toLowerCase()).toBe(B.toLowerCase());
  });

  it("clamps a revoke larger than the current votes to zero (bottom of the list)", async () => {
    // T holds 10; revoking 999 clamps to 0 → sits below B, so lesser is zero
    mockReadContract(() => [
      [T, B],
      [10n, 30n],
    ]);

    const { lesser, greater } = await getVoteNeighbors(ELECTION, T, 999n, false);

    expect(lesser).toBe(ZERO);
    expect(greater.toLowerCase()).toBe(B.toLowerCase());
  });

  it("handles groups with equal vote totals without throwing", async () => {
    // A and B tie on votes (exercises the equal-votes comparator branch)
    mockReadContract(() => [
      [A, B],
      [20n, 20n],
    ]);

    const { lesser } = await getVoteNeighbors(ELECTION, T, 5n, true);

    // T (5 votes) is the lowest, so it has no lesser neighbor
    expect(lesser).toBe(ZERO);
  });
});
