import { createApi } from "../api/index";
import coinConfig from "../config";
import tzktApi from "../network/tzkt";

describe("getStakes", () => {
  const api = createApi({
    baker: { url: "http://baker.example.com" },
    explorer: { url: "http://tezos.explorer.com", maxTxQuery: 100 },
    node: { url: "http://tezos.node.com" },
    fees: {
      minGasLimit: 600,
      minRevealGasLimit: 300,
      minStorageLimit: 0,
      minFees: 500,
      minEstimatedFees: 500,
    },
  });

  const mockGetAccountByAddress = jest.spyOn(tzktApi, "getAccountByAddress");
  const mockGetUnstakeRequests = jest.spyOn(tzktApi, "getUnstakeRequests");

  const makeRequest = (overrides: Partial<{
    id: number;
    cycle: number;
    bakerAddress: string;
    stakerAddress: string;
    firstTime: string;
    status: "pending" | "finalizable" | "finalized";
    actualAmount: number;
  }>) => ({
    id: overrides.id ?? 1,
    cycle: overrides.cycle ?? 100,
    baker: { address: overrides.bakerAddress ?? "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx" },
    staker: { address: overrides.stakerAddress ?? "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8" },
    firstTime: overrides.firstTime ?? "2026-05-01T00:00:00Z",
    status: overrides.status ?? ("pending" as const),
    actualAmount: overrides.actualAmount ?? 10,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUnstakeRequests.mockResolvedValue([]);

    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      baker: { url: "http://baker.example.com" },
      explorer: { url: "http://tezos.explorer.com", maxTxQuery: 100 },
      node: { url: "http://tezos.node.com" },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 500,
        minEstimatedFees: 500,
      },
    }));
  });

  describe("account types", () => {
    it("should return empty stakes for non-delegated account", async () => {
      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address: "tz1WvvbEGpBXGeTVbLiR6DYBe1izmgiYuZbq",
        publicKey: "edpk...",
        balance: 1000000,
        revealed: true,
        counter: 0,
        delegationLevel: 0,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2021-01-01T00:00:00Z",
      });

      const result = await api.getStakes("tz1WvvbEGpBXGeTVbLiR6DYBe1izmgiYuZbq");

      expect(result.items).toEqual([]);
    });

    it("should return empty stakes for non user account", async () => {
      mockGetAccountByAddress.mockResolvedValue({
        type: "empty",
        address: "tz1EmptyAccount",
        counter: 0,
      });

      const result = await api.getStakes("tz1EmptyAccount");

      expect(result.items).toEqual([]);
    });

    it("should return stake position for non-delegated account with stakedBalance > 0", async () => {
      const address = "tz1NoDelegateStaker";
      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address,
        publicKey: "edpk...",
        balance: 100,
        stakedBalance: 30,
        revealed: true,
        counter: 0,
        delegationLevel: 0,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2021-01-01T00:00:00Z",
      });

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `stake-${address}`,
          address,
          state: "active",
          asset: { type: "native" },
          amount: 30n,
          actions: [],
        },
      ]);
    });

    it("should return unstaking position for non-delegated account with unstakedBalance > 0", async () => {
      const address = "tz1NoDelegateUnstaker";
      const bakerAddress = "tz1BakerOfUnstake";
      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address,
        publicKey: "edpk...",
        balance: 100,
        unstakedBalance: 10,
        revealed: true,
        counter: 0,
        delegationLevel: 0,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2021-01-01T00:00:00Z",
      });
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({ id: 42, bakerAddress, actualAmount: 10, firstTime: "2026-05-01T00:00:00Z" }),
      ]);

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `unstaking-42`,
          address,
          delegate: bakerAddress,
          state: "deactivating",
          createdAt: new Date("2026-05-01T00:00:00Z"),
          asset: { type: "native" },
          amount: 10n,
          actions: [],
        },
      ]);
    });
  });

  describe("delegated accounts", () => {
    const address = "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8";
    const delegateAddress = "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx";

    function makeAccount(overrides: Record<string, unknown> = {}) {
      return {
        type: "user" as const,
        address,
        publicKey: "edpk...",
        balance: 5000000,
        revealed: true,
        counter: 0,
        delegate: { alias: "Test Delegate", address: delegateAddress, active: true },
        delegationLevel: 100,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 10,
        firstActivityTime: "2021-01-01T00:00:00Z",
        ...overrides,
      };
    }

    it("should return delegation stake for delegated account with no staking", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount());

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 5000000n,
          actions: [],
        },
      ]);
    });

    it("should handle account with zero balance but delegation", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 0 }));

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 0n,
          actions: [],
        },
      ]);
    });

    it("should return delegation + stake when stakedBalance > 0", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 100, stakedBalance: 30 }));

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 70n,
          actions: [],
        },
        {
          uid: `stake-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 30n,
          actions: [],
        },
      ]);
    });

    it("should return delegation + unstaking when unstakedBalance > 0", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 100, unstakedBalance: 10 }));
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({
          id: 7,
          bakerAddress: delegateAddress,
          actualAmount: 10,
          firstTime: "2026-05-01T00:00:00Z",
        }),
      ]);

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 90n,
          actions: [],
        },
        {
          uid: `unstaking-7`,
          address,
          delegate: delegateAddress,
          state: "deactivating",
          createdAt: new Date("2026-05-01T00:00:00Z"),
          asset: { type: "native" },
          amount: 10n,
          actions: [],
        },
      ]);
    });

    it("should return all three positions when delegate, stakedBalance and unstakedBalance are set", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({ balance: 100, stakedBalance: 30, unstakedBalance: 10 }),
      );
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({
          id: 11,
          bakerAddress: delegateAddress,
          actualAmount: 10,
          firstTime: "2026-05-02T00:00:00Z",
        }),
      ]);

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 60n,
          actions: [],
        },
        {
          uid: `stake-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 30n,
          actions: [],
        },
        {
          uid: `unstaking-11`,
          address,
          delegate: delegateAddress,
          state: "deactivating",
          createdAt: new Date("2026-05-02T00:00:00Z"),
          asset: { type: "native" },
          amount: 10n,
          actions: [],
        },
      ]);

      const total = result.items.reduce((sum, i) => sum + i.amount, 0n);
      expect(total).toBe(100n);
    });
  });

  describe("finalizable unstakes", () => {
    const address = "tz1FinalizableStaker";
    const delegateAddress = "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx";

    function makeAccount(overrides: Record<string, unknown> = {}) {
      return {
        type: "user" as const,
        address,
        publicKey: "edpk...",
        balance: 1000,
        revealed: true,
        counter: 0,
        delegationLevel: 0,
        delegationTime: "2026-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2026-01-01T00:00:00Z",
        ...overrides,
      };
    }

    it("emits one position per unstake request mixing pending and finalizable", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({
          balance: 1000,
          unstakedBalance: 100,
          delegate: { alias: "B", address: delegateAddress, active: true },
        }),
      );
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({
          id: 1,
          bakerAddress: delegateAddress,
          actualAmount: 60,
          firstTime: "2026-05-01T00:00:00Z",
          status: "pending",
        }),
        makeRequest({
          id: 2,
          bakerAddress: delegateAddress,
          actualAmount: 40,
          firstTime: "2026-04-25T00:00:00Z",
          status: "finalizable",
        }),
      ]);

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 900n,
          actions: [],
        },
        {
          uid: `unstaking-1`,
          address,
          delegate: delegateAddress,
          state: "deactivating",
          createdAt: new Date("2026-05-01T00:00:00Z"),
          asset: { type: "native" },
          amount: 60n,
          actions: [],
        },
        {
          uid: `finalizable-2`,
          address,
          delegate: delegateAddress,
          state: "inactive",
          createdAt: new Date("2026-04-25T00:00:00Z"),
          asset: { type: "native" },
          amount: 40n,
          actions: [],
        },
      ]);
    });

    it("preserves the unstake-request baker, not the account's current delegate", async () => {
      const previousBaker = "tz1PreviousBaker";
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({ balance: 1000, unstakedBalance: 50 }),
      );
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({
          id: 99,
          bakerAddress: previousBaker,
          actualAmount: 50,
          firstTime: "2026-05-03T00:00:00Z",
        }),
      ]);

      const result = await api.getStakes(address);

      const unstaking = result.items.find(i => i.uid === "unstaking-99");
      expect(unstaking?.delegate).toBe(previousBaker);
    });

    it("skips requests with non-positive actualAmount", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({ balance: 1000, unstakedBalance: 10 }),
      );
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({ id: 3, actualAmount: 0 }),
        makeRequest({ id: 4, actualAmount: 10, firstTime: "2026-05-04T00:00:00Z" }),
      ]);

      const result = await api.getStakes(address);

      expect(result.items.filter(i => i.uid.startsWith("unstaking-"))).toHaveLength(1);
      expect(result.items.find(i => i.uid === "unstaking-4")?.amount).toBe(10n);
    });

    it("skips the unstake-requests endpoint entirely when unstakedBalance is 0", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 1000, unstakedBalance: 0 }));

      const result = await api.getStakes(address);

      expect(result.items).toEqual([]);
      expect(mockGetUnstakeRequests).not.toHaveBeenCalled();
    });

    it("skips unstake requests with an invalid firstTime", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({ balance: 1000, unstakedBalance: 30 }),
      );
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({ id: 1, actualAmount: 10, firstTime: "not-a-date" }),
        makeRequest({ id: 2, actualAmount: 20, firstTime: "2026-05-04T00:00:00Z" }),
      ]);

      const result = await api.getStakes(address);

      expect(result.items.map(i => i.uid)).toEqual(["unstaking-2"]);
    });

    it("drops finalized requests (funds already returned to spendable)", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 1000, unstakedBalance: 30 }));
      mockGetUnstakeRequests.mockResolvedValue([
        makeRequest({ id: 1, actualAmount: 480, status: "finalized" }),
        makeRequest({ id: 2, actualAmount: 30, firstTime: "2026-05-04T00:00:00Z" }),
      ]);

      const result = await api.getStakes(address);

      expect(result.items.map(i => i.uid)).toEqual(["unstaking-2"]);
      expect(result.items.find(i => i.uid === "unstaking-2")?.amount).toBe(30n);
    });

    it("propagates rejection when getUnstakeRequests fails", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 100, unstakedBalance: 10 }));
      mockGetUnstakeRequests.mockRejectedValueOnce(new Error("tzkt 500"));

      await expect(api.getStakes(address)).rejects.toThrow("tzkt 500");
    });
  });

  describe("delegation amount clamping", () => {
    const address = "tz1Reorg";
    const delegateAddress = "tz1Baker";

    it("clamps delegation amount to 0 when balance < stakedBalance (TzKT reorg edge)", async () => {
      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address,
        publicKey: "edpk...",
        balance: 50,
        stakedBalance: 80,
        revealed: true,
        counter: 0,
        delegate: { alias: "B", address: delegateAddress, active: true },
        delegationLevel: 100,
        delegationTime: "2026-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2026-01-01T00:00:00Z",
      });

      const result = await api.getStakes(address);

      const delegation = result.items.find(i => i.uid === `delegation-${address}`);
      expect(delegation?.amount).toBe(0n);
    });
  });
});
