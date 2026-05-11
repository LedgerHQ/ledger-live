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
  const mockGetUnstakeRequestsFinalizable = jest.spyOn(tzktApi, "getUnstakeRequestsFinalizable");

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUnstakeRequestsFinalizable.mockResolvedValue(0n);

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
        },
      ]);
    });

    it("should return unstaking position for non-delegated account with unstakedBalance > 0", async () => {
      const address = "tz1NoDelegateUnstaker";
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

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `unstaking-${address}`,
          address,
          state: "deactivating",
          asset: { type: "native" },
          amount: 10n,
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
        },
        {
          uid: `stake-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 30n,
        },
      ]);
    });

    it("should return delegation + unstaking when unstakedBalance > 0", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 100, unstakedBalance: 10 }));

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 100n,
        },
        {
          uid: `unstaking-${address}`,
          address,
          delegate: delegateAddress,
          state: "deactivating",
          asset: { type: "native" },
          amount: 10n,
        },
      ]);
    });

    it("should return all three positions when delegate, stakedBalance and unstakedBalance are set", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({ balance: 100, stakedBalance: 30, unstakedBalance: 10 }),
      );

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 70n,
        },
        {
          uid: `stake-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 30n,
        },
        {
          uid: `unstaking-${address}`,
          address,
          delegate: delegateAddress,
          state: "deactivating",
          asset: { type: "native" },
          amount: 10n,
        },
      ]);
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

    it("splits unstakedBalance into deactivating and finalizable when finalizable > 0", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({
          balance: 1000,
          unstakedBalance: 100,
          delegate: { alias: "B", address: delegateAddress, active: true },
        }),
      );
      mockGetUnstakeRequestsFinalizable.mockResolvedValue(40n);

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 1000n,
        },
        {
          uid: `unstaking-${address}`,
          address,
          delegate: delegateAddress,
          state: "deactivating",
          asset: { type: "native" },
          amount: 60n,
        },
        {
          uid: `finalizable-${address}`,
          address,
          delegate: delegateAddress,
          state: "inactive",
          asset: { type: "native" },
          amount: 40n,
        },
      ]);
    });

    it("emits only finalizable when the entire unstakedBalance is finalizable", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({ balance: 1000, unstakedBalance: 100 }),
      );
      mockGetUnstakeRequestsFinalizable.mockResolvedValue(100n);

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `finalizable-${address}`,
          address,
          state: "inactive",
          asset: { type: "native" },
          amount: 100n,
        },
      ]);
    });

    it("clamps finalizable to unstakedBalance when the two endpoints momentarily disagree", async () => {
      // A `finalize_unstake` landing between the two TzKT calls could make
      // `finalizable` exceed the still-cached `unstakedBalance`. Prevent a negative
      // `unstaking-*` amount.
      mockGetAccountByAddress.mockResolvedValue(
        makeAccount({ balance: 1000, unstakedBalance: 30 }),
      );
      mockGetUnstakeRequestsFinalizable.mockResolvedValue(50n);

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        {
          uid: `finalizable-${address}`,
          address,
          state: "inactive",
          asset: { type: "native" },
          amount: 30n,
        },
      ]);
    });

    it("skips the finalizable endpoint entirely when unstakedBalance is 0", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeAccount({ balance: 1000, unstakedBalance: 0 }));

      const result = await api.getStakes(address);

      expect(result.items).toEqual([]);
      expect(mockGetUnstakeRequestsFinalizable).not.toHaveBeenCalled();
    });
  });
});
