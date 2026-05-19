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
    if (id === "solana-wallet-id") return "solana-account-id";
    return undefined;
  }),
}));

import BigNumber from "bignumber.js";
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
    spendableBalance: new BigNumber(1_000_000),
    balance: new BigNumber(1_000_000),
  };

  const solanaAccount = {
    id: "solana-account-id",
    type: "Account" as const,
    currency: { family: "solana", id: "solana" },
    balance: { isZero: () => false, gt: () => true },
    spendableBalance: { isZero: () => false, gt: () => true },
    solanaResources: {
      stakes: [{ activation: { state: "active" }, withdrawable: 0 }],
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let h: any;

  beforeEach(() => {
    mockUiOpen.mockClear();
    h = handlers({
      accounts: [cosmosAccount as never, solanaAccount as never],
      uiHooks: { "custom.earn.intent.open": mockUiOpen },
    });
  });

  describe("custom.earn.intent.open", () => {
    it("calls uiHook with valid params", () => {
      h["custom.earn.intent.open"]({
        accountId: "known-wallet-id",
        intent: "stake",
      });
      expect(mockUiOpen).toHaveBeenCalledWith({
        accountId: "known-wallet-id",
        intent: "stake",
      });
    });

    it("passes validatorAddress for restake", () => {
      h["custom.earn.intent.open"]({
        accountId: "known-wallet-id",
        intent: "restake",
        validatorAddress: "cosmosvaloper1",
      });
      expect(mockUiOpen).toHaveBeenCalledWith({
        accountId: "known-wallet-id",
        intent: "restake",
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
          expect.objectContaining({ intent: "stake", label: "Delegate" }),
          expect.objectContaining({ intent: "unstake", label: "Undelegate" }),
          expect.objectContaining({ intent: "restake", label: "Redelegate" }),
          expect.objectContaining({ intent: "claimRewards", label: "Claim rewards" }),
        ]),
      );
    });

    it("returns intents for a solana account", () => {
      const result = h["custom.earn.intent.list"]({
        accountId: "solana-wallet-id",
      });
      expect(result.intents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ intent: "stake", label: "Delegate" }),
          expect.objectContaining({ intent: "unstake", label: "Deactivate" }),
        ]),
      );
    });

    it("returns stake as enabled for cosmos", () => {
      const result = h["custom.earn.intent.list"]({
        accountId: "known-wallet-id",
      });
      const stake = result.intents.find((i: { intent: string }) => i.intent === "stake");
      expect(stake?.enabled).toBe(true);
    });

    it("returns unstake as enabled when delegations exist and unbondings < 7", () => {
      const result = h["custom.earn.intent.list"]({
        accountId: "known-wallet-id",
      });
      const unstake = result.intents.find((i: { intent: string }) => i.intent === "unstake");
      expect(unstake?.enabled).toBe(true);
      expect(unstake?.params).toContain("validatorAddress");
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
