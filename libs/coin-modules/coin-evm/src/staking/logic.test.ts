import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type {
  Operation,
  StakingAccount,
  StakingDelegation,
  StakingDelegationStatus,
} from "@ledgerhq/types-live";
import {
  canCompound,
  canRedelegate,
  canUndelegate,
  canWithdraw,
  getMaxEstimatedBalance,
  isSeiAccountUnassociated,
} from "./logic";

jest.mock("../config");
jest.mock("../network/node/types");

const mockGetCoinConfig = jest.mocked(require("../config").getCoinConfig);
const mockIsExternalNodeConfig = jest.mocked(require("../network/node/types").isExternalNodeConfig);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAccount(
  currencyId: string,
  redelegations: StakingAccount["stakingResources"]["redelegations"] = [],
  {
    freshAddress = "0xMyAddress",
    operations = [] as Operation[],
  }: { freshAddress?: string; operations?: Operation[] } = {},
): StakingAccount {
  return {
    currency: { id: currencyId } as CryptoCurrency,
    freshAddress,
    operations,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    stakingResources: {
      delegations: [],
      redelegations,
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    },
  } as unknown as StakingAccount;
}

function makeDelegation(
  validatorAddress: string,
  status: StakingDelegationStatus,
): StakingDelegation {
  return {
    validatorAddress,
    amount: new BigNumber(0),
    pendingRewards: new BigNumber(0),
    status,
  } as unknown as StakingDelegation;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("evm staking logic", () => {
  describe("canRedelegate", () => {
    const FUTURE = new Date(Date.now() + 86_400_000);

    it("returns false for a chain without a redelegate precompile function (celo)", () => {
      const account = makeAccount("celo");
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(false);
    });

    it("returns false for an unknown currency id", () => {
      const account = makeAccount("unknown_chain");
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(false);
    });

    it("returns true for sei_evm when no active redelegations exist", () => {
      const account = makeAccount("sei_evm");
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(true);
    });

    it("returns false when the delegation is the destination of an active redelegation (cooldown)", () => {
      const account = makeAccount("sei_evm", [
        {
          validatorSrcAddress: "0xsrc",
          validatorDstAddress: "0xvalidator",
          completionDate: FUTURE,
          amount: new BigNumber(0),
        },
      ]);
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(false);
    });

    it("returns false when the maxRedelegations cap is reached", () => {
      const activeRedelegations = Array.from({ length: 7 }, (_, i) => ({
        validatorSrcAddress: `0xsrc${i}`,
        validatorDstAddress: `0xdst${i}`,
        completionDate: FUTURE,
        amount: new BigNumber(0),
      }));
      const account = makeAccount("sei_evm", activeRedelegations);
      expect(canRedelegate(account, makeDelegation("0xother", "bonded"))).toBe(false);
    });

    it("ignores expired redelegations when checking the cooldown", () => {
      const past = new Date(Date.now() - 86_400_000);
      const account = makeAccount("sei_evm", [
        {
          validatorSrcAddress: "0xsrc",
          validatorDstAddress: "0xvalidator",
          completionDate: past,
          amount: new BigNumber(0),
        },
      ]);
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(true);
    });
  });

  describe("canCompound", () => {
    it("returns false for a chain without a compound precompile function (sei_evm)", () => {
      const account = makeAccount("sei_evm");
      const delegation = {
        ...makeDelegation("0xvalidator", "bonded"),
        pendingRewards: new BigNumber(100),
      };
      expect(canCompound(account, delegation)).toBe(false);
    });

    it("returns false for monad when there are no pending rewards", () => {
      const account = makeAccount("monad");
      expect(canCompound(account, makeDelegation("0xvalidator", "bonded"))).toBe(false);
    });

    it("returns true for monad when there are pending rewards", () => {
      const account = makeAccount("monad");
      const delegation = {
        ...makeDelegation("0xvalidator", "bonded"),
        pendingRewards: new BigNumber(100),
      };
      expect(canCompound(account, delegation)).toBe(true);
    });
  });

  describe("canUndelegate", () => {
    it("returns true for a bonded delegation", () => {
      const account = makeAccount("monad");
      expect(canUndelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(true);
    });

    it("returns false for an activating delegation", () => {
      const account = makeAccount("monad");
      expect(canUndelegate(account, makeDelegation("0xvalidator", "activating"))).toBe(false);
    });

    it("returns true when no delegation is provided", () => {
      const account = makeAccount("monad");
      expect(canUndelegate(account)).toBe(true);
    });
  });

  describe("canWithdraw", () => {
    it("returns true for a withdrawable unbonding with a withdrawId", () => {
      expect(canWithdraw({ withdrawId: 0, status: "withdrawable" })).toBe(true);
    });

    it("returns false while the unbonding is still deactivating", () => {
      expect(canWithdraw({ withdrawId: 0, status: "deactivating" })).toBe(false);
    });

    it("returns false when there is no withdrawId (chains that auto-return funds)", () => {
      expect(canWithdraw({ status: "withdrawable" })).toBe(false);
    });
  });

  describe("isSeiAccountUnassociated", () => {
    const SEI_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
    let contractSpy: jest.SpyInstance;
    let providerSpy: jest.SpyInstance;
    let mockGetSeiAddr: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetSeiAddr = jest.fn().mockResolvedValue("sei1associatedcosmosaddress");
      providerSpy = jest.spyOn(ethers, "JsonRpcProvider" as any).mockImplementation(() => ({}));
      contractSpy = jest
        .spyOn(ethers, "Contract" as any)
        .mockImplementation(() => ({ getSeiAddr: mockGetSeiAddr }));

      const mockNode = { type: "external", uri: "https://sei-evm.coin.ledger.com" };
      mockGetCoinConfig.mockReturnValue({ info: { node: mockNode } });
      mockIsExternalNodeConfig.mockImplementation((node: unknown) => node === mockNode);
    });

    afterEach(() => {
      contractSpy.mockRestore();
      providerSpy.mockRestore();
    });

    it("returns false for a non-sei_evm currency without querying the chain", async () => {
      await expect(isSeiAccountUnassociated("ethereum", SEI_ADDRESS)).resolves.toBe(false);
      expect(mockGetSeiAddr).not.toHaveBeenCalled();
    });

    it("returns false when the currency has no external RPC node configured", async () => {
      mockIsExternalNodeConfig.mockReturnValue(false);
      await expect(isSeiAccountUnassociated("sei_evm", SEI_ADDRESS)).resolves.toBe(false);
      expect(mockGetSeiAddr).not.toHaveBeenCalled();
    });

    it("returns true for sei_evm when the precompile resolves an empty string (unassociated)", async () => {
      mockGetSeiAddr.mockResolvedValue("");
      await expect(isSeiAccountUnassociated("sei_evm", SEI_ADDRESS)).resolves.toBe(true);
      expect(mockGetSeiAddr).toHaveBeenCalledWith(SEI_ADDRESS);
    });

    it("returns false for sei_evm when the precompile resolves a linked Cosmos address", async () => {
      mockGetSeiAddr.mockResolvedValue("sei1associatedcosmosaddress");
      await expect(isSeiAccountUnassociated("sei_evm", SEI_ADDRESS)).resolves.toBe(false);
    });

    it("returns true when the precompile reverts (unassociated address)", async () => {
      const revert = Object.assign(new Error("missing revert data"), {
        code: "CALL_EXCEPTION",
        data: null,
        reason: null,
        revert: null,
      });
      mockGetSeiAddr.mockRejectedValue(revert);
      await expect(isSeiAccountUnassociated("sei_evm", SEI_ADDRESS)).resolves.toBe(true);
    });

    it("returns true when the precompile call fails for any other reason", async () => {
      mockGetSeiAddr.mockRejectedValue(new Error("network error"));
      await expect(isSeiAccountUnassociated("sei_evm", SEI_ADDRESS)).resolves.toBe(true);
    });

    it("returns true when the precompile returns an unexpected non-string result", async () => {
      mockGetSeiAddr.mockResolvedValue(undefined);
      await expect(isSeiAccountUnassociated("sei_evm", SEI_ADDRESS)).resolves.toBe(true);
    });

    it("returns false when the EVM module config is not set (getCoinConfig throws)", async () => {
      mockGetCoinConfig.mockImplementation(() => {
        throw new Error("EVM module config not set");
      });
      await expect(isSeiAccountUnassociated("sei_evm", SEI_ADDRESS)).resolves.toBe(false);
    });
  });

  describe("getMaxEstimatedBalance", () => {
    it("uses the spendable balance without subtracting staked resources again", () => {
      const account = {
        balance: new BigNumber("3062112500000000000"),
        spendableBalance: new BigNumber("3062112500000000000"),
        stakingResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: new BigNumber("3000000000000000000"),
          pendingRewardsBalance: new BigNumber(0),
          unbondingBalance: new BigNumber(0),
        },
      } as unknown as StakingAccount;

      expect(getMaxEstimatedBalance(account, new BigNumber("100000000000000000"))).toEqual(
        new BigNumber("2962112500000000000"),
      );
    });

    it("returns zero when fees exceed spendable balance", () => {
      const account = {
        balance: new BigNumber("1000"),
        spendableBalance: new BigNumber("500"),
        stakingResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: new BigNumber(0),
          pendingRewardsBalance: new BigNumber(0),
          unbondingBalance: new BigNumber(0),
        },
      } as unknown as StakingAccount;

      expect(getMaxEstimatedBalance(account, new BigNumber("600"))).toEqual(new BigNumber(0));
    });
  });
});
