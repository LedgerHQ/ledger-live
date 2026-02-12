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

  beforeEach(() => {
    jest.clearAllMocks();

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
  });

  describe("delegated accounts", () => {
    it("should return stake for delegated account", async () => {
      const address = "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8";
      const delegateAddress = "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx";
      const balance = 5000000;

      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address,
        publicKey: "edpk...",
        balance,
        revealed: true,
        counter: 0,
        delegate: {
          alias: "Test Delegate",
          address: delegateAddress,
          active: true,
        },
        delegationLevel: 100,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 10,
        firstActivityTime: "2021-01-01T00:00:00Z",
      });

      const result = await api.getStakes(address);

      expect(result.items).toEqual([
        expect.objectContaining({
          uid: address,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: BigInt(balance),
        }),
      ]);
    });

    it("should handle account with zero balance but delegation", async () => {
      const address = "tz1ZeroBalanceAccount";
      const delegateAddress = "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx";

      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address,
        publicKey: "edpk...",
        balance: 0,
        revealed: true,
        counter: 0,
        delegate: {
          alias: "Test Delegate",
          address: delegateAddress,
          active: true,
        },
        delegationLevel: 100,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2021-01-01T00:00:00Z",
      });

      const result = await api.getStakes(address);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        uid: address,
        address,
        delegate: delegateAddress,
        state: "active",
        asset: { type: "native" },
        amount: BigInt(0),
      });
    });
  });
});
