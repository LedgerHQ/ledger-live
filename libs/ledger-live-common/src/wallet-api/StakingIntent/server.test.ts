jest.mock("@ledgerhq/wallet-api-server", () => ({
  RPCHandler: jest.fn(),
  customWrapper: jest.fn(handler => handler),
}));

jest.mock("@ledgerhq/wallet-api-core", () => ({
  createUnknownError: jest.fn(opts => ({ code: "UnknownError", ...opts })),
  ServerError: class ServerError extends Error {
    constructor(public error: { message?: string }) {
      super(error?.message ?? "ServerError");
    }
  },
}));

jest.mock("../converters", () => ({
  getAccountIdFromWalletAccountId: jest.fn((id: string) => {
    if (id === "known-wallet-id") return "real-account-id";
    return undefined;
  }),
}));

import { handlers } from "./server";

describe("StakingIntent server handlers", () => {
  const mockUiOpen = jest.fn();

  const cosmosAccount = {
    id: "real-account-id",
    type: "Account" as const,
    currency: { family: "cosmos", id: "cosmos" },
    cosmosResources: {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1",
          pendingRewards: { gt: (n: number) => n === 0 },
        },
      ],
      redelegations: [],
      unbondings: [],
      delegatedBalance: { gt: (n: number) => n === 0 },
      pendingRewardsBalance: { gt: (n: number) => n === 0 },
      unbondingBalance: { gt: (n: number) => false },
    },
    spendableBalance: { gt: () => true },
    balance: { gt: () => true },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let h: any;

  beforeEach(() => {
    mockUiOpen.mockClear();
    h = handlers({
      accounts: [cosmosAccount as never],
      uiHooks: { "custom.earn.intent.open": mockUiOpen },
    });
  });

  describe("custom.earn.intent.open", () => {
    it("calls uiHook with valid params", () => {
      h["custom.earn.intent.open"]({
        accountId: "known-wallet-id",
        intent: "delegate",
      });
      expect(mockUiOpen).toHaveBeenCalledWith({
        accountId: "known-wallet-id",
        intent: "delegate",
      });
    });

    it("passes validatorAddress for redelegate", () => {
      h["custom.earn.intent.open"]({
        accountId: "known-wallet-id",
        intent: "redelegate",
        validatorAddress: "cosmosvaloper1",
      });
      expect(mockUiOpen).toHaveBeenCalledWith({
        accountId: "known-wallet-id",
        intent: "redelegate",
        validatorAddress: "cosmosvaloper1",
      });
    });

    it("rejects without accountId", () => {
      expect(() => h["custom.earn.intent.open"]({})).toThrow(/accountId is required/);
    });

    it("rejects with invalid intent", () => {
      expect(() =>
        h["custom.earn.intent.open"]({
          accountId: "known-wallet-id",
          intent: "invalid",
        }),
      ).toThrow(/intent must be one of/);
    });

    it("rejects without intent", () => {
      expect(() =>
        h["custom.earn.intent.open"]({
          accountId: "known-wallet-id",
        }),
      ).toThrow(/intent must be one of/);
    });
  });

  describe("custom.earn.intent.list", () => {
    it("returns intents for a cosmos account", () => {
      const result = h["custom.earn.intent.list"]({
        accountId: "known-wallet-id",
      });
      expect(result).toHaveProperty("intents");
      expect(result.intents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "delegate" }),
          expect.objectContaining({ name: "redelegate" }),
          expect.objectContaining({ name: "unbond" }),
          expect.objectContaining({ name: "claimRewards" }),
        ]),
      );
    });

    it("returns delegate as enabled", () => {
      const result = h["custom.earn.intent.list"]({
        accountId: "known-wallet-id",
      });
      const delegate = result.intents.find((i: { name: string }) => i.name === "delegate");
      expect(delegate?.enabled).toBe(true);
    });

    it("returns unbond as enabled when delegations exist and unbondings < 7", () => {
      const result = h["custom.earn.intent.list"]({
        accountId: "known-wallet-id",
      });
      const unbond = result.intents.find((i: { name: string }) => i.name === "unbond");
      expect(unbond?.enabled).toBe(true);
      expect(unbond?.params).toContain("validatorAddress");
    });

    it("rejects without accountId", () => {
      expect(() => h["custom.earn.intent.list"]({})).toThrow(/accountId is required/);
    });

    it("rejects with unknown accountId", () => {
      expect(() =>
        h["custom.earn.intent.list"]({
          accountId: "unknown-wallet-id",
        }),
      ).toThrow(/unknown/);
    });
  });
});
