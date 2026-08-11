import { ethers } from "ethers";
import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import {
  canCompound,
  canRedelegate,
  canUndelegate,
  canWithdraw,
  isSeiAccountUnassociated,
} from "./logic";

jest.mock("../config");
jest.mock("../network/node/types");

const mockGetCoinConfig = jest.mocked(require("../config").getCoinConfig);
const mockIsExternalNodeConfig = jest.mocked(require("../network/node/types").isExternalNodeConfig);

function makeStake(delegate: string, overrides: Partial<Stake> = {}): Stake {
  return {
    uid: `${delegate}-test`,
    address: "0xMyAddress",
    delegate,
    state: "active",
    asset: { type: "native" },
    amount: 0n,
    actions: [],
    ...overrides,
  };
}

describe("evm staking logic", () => {
  describe("canRedelegate", () => {
    const FUTURE = new Date(Date.now() + 86_400_000);

    it("returns false for a chain without a redelegate precompile function (celo)", () => {
      expect(canRedelegate(makeStake("0xvalidator"), [], "celo")).toBe(false);
    });

    it("returns false for an unknown currency id", () => {
      expect(canRedelegate(makeStake("0xvalidator"), [], "unknown_chain")).toBe(false);
    });

    it("returns true for sei_evm when no active redelegations exist", () => {
      expect(canRedelegate(makeStake("0xvalidator"), [], "sei_evm")).toBe(true);
    });

    it("returns false when the delegation is the destination of an active redelegation (cooldown)", () => {
      const activeRedelegations = [{ validatorDstAddress: "0xvalidator", completionDate: FUTURE }];
      expect(canRedelegate(makeStake("0xvalidator"), activeRedelegations, "sei_evm")).toBe(false);
    });

    it("returns false when the maxRedelegations cap is reached", () => {
      const activeRedelegations = Array.from({ length: 7 }, (_, i) => ({
        validatorDstAddress: `0xdst${i}`,
        completionDate: FUTURE,
      }));
      expect(canRedelegate(makeStake("0xother"), activeRedelegations, "sei_evm")).toBe(false);
    });
  });

  describe("canCompound", () => {
    it("returns false for a chain without a compound precompile function (sei_evm)", () => {
      expect(canCompound(makeStake("0xvalidator", { amountRewarded: 100n }), "sei_evm")).toBe(
        false,
      );
    });

    it("returns false for monad when there are no pending rewards", () => {
      expect(canCompound(makeStake("0xvalidator"), "monad")).toBe(false);
    });

    it("returns true for monad when there are pending rewards", () => {
      expect(canCompound(makeStake("0xvalidator", { amountRewarded: 100n }), "monad")).toBe(true);
    });
  });

  describe("canUndelegate", () => {
    it("returns true for an active stake", () => {
      expect(canUndelegate(makeStake("0xvalidator"), "monad")).toBe(true);
    });

    it("returns false for an activating stake", () => {
      expect(canUndelegate(makeStake("0xvalidator", { state: "activating" }), "monad")).toBe(false);
    });

    it("returns false for 0G when shares is zero", () => {
      expect(
        canUndelegate(makeStake("0xvalidator", { details: { shares: 0n } }), "zero_gravity"),
      ).toBe(false);
    });

    it("returns false for 0G when shares is below the 1e9 minimum", () => {
      expect(
        canUndelegate(
          makeStake("0xvalidator", { details: { shares: 999_999_999n } }),
          "zero_gravity",
        ),
      ).toBe(false);
    });

    it("returns true for 0G when shares meets the 1e9 minimum", () => {
      expect(
        canUndelegate(
          makeStake("0xvalidator", { details: { shares: 1_000_000_000n } }),
          "zero_gravity",
        ),
      ).toBe(true);
    });

    it("returns true for 0G when shares is undefined (legacy pre-sync account)", () => {
      expect(canUndelegate(makeStake("0xvalidator"), "zero_gravity")).toBe(true);
    });
  });

  describe("canWithdraw", () => {
    it("returns true for a withdrawable stake with a withdrawId", () => {
      expect(canWithdraw({ state: "withdrawable", details: { withdrawId: 0 } })).toBe(true);
    });

    it("returns false while the stake is still deactivating", () => {
      expect(canWithdraw({ state: "deactivating", details: { withdrawId: 0 } })).toBe(false);
    });

    it("returns false when there is no withdrawId (chains that auto-return funds)", () => {
      expect(canWithdraw({ state: "withdrawable" })).toBe(false);
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
});
