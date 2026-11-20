import BigNumber from "bignumber.js";
import {
  ALGORAND_MIN_ACCOUNT_BALANCE,
  computeAlgoMaxSpendable,
  isAmountValid,
  recipientHasAsset,
} from "./bridgeLogic";
import { setCoinConfig } from "./config";
import { getAccount } from "./network";
import { mockAlgorandConfig } from "./test/context";
import { buildNetworkAccount, FUNDED_RECIPIENT, UNFUNDED_RECIPIENT } from "./test/fixtures";

jest.mock("./network", () => ({ getAccount: jest.fn() }));

const mockGetAccount = getAccount as jest.Mock;

describe("bridgeLogic", () => {
  beforeEach(() => {
    setCoinConfig(() => mockAlgorandConfig);
    mockGetAccount.mockReset();
  });

  describe("recipientHasAsset", () => {
    it("returns true when the recipient holds the asset", async () => {
      mockGetAccount.mockResolvedValue(
        buildNetworkAccount(FUNDED_RECIPIENT, { assets: ["312769"] }),
      );

      expect(await recipientHasAsset(FUNDED_RECIPIENT, "312769")).toBe(true);
    });

    it("returns false when the recipient did not opt in the asset", async () => {
      mockGetAccount.mockResolvedValue(buildNetworkAccount(FUNDED_RECIPIENT, { assets: ["1"] }));

      expect(await recipientHasAsset(FUNDED_RECIPIENT, "312769")).toBe(false);
    });

    it("reads the recipient from the configured node", async () => {
      mockGetAccount.mockResolvedValue(buildNetworkAccount(FUNDED_RECIPIENT));

      await recipientHasAsset(FUNDED_RECIPIENT, "312769");

      expect(mockGetAccount).toHaveBeenCalledWith(mockAlgorandConfig, FUNDED_RECIPIENT);
    });
  });

  describe("isAmountValid", () => {
    it("accepts any amount for a recipient that already holds funds", async () => {
      mockGetAccount.mockResolvedValue(buildNetworkAccount(FUNDED_RECIPIENT));

      expect(await isAmountValid(FUNDED_RECIPIENT, new BigNumber(1))).toBe(true);
    });

    it("rejects an amount below the minimum account balance for an unfunded recipient", async () => {
      mockGetAccount.mockResolvedValue(buildNetworkAccount(UNFUNDED_RECIPIENT, { balance: "0" }));

      expect(
        await isAmountValid(UNFUNDED_RECIPIENT, new BigNumber(ALGORAND_MIN_ACCOUNT_BALANCE - 1)),
      ).toBe(false);
    });

    it("accepts the minimum account balance for an unfunded recipient", async () => {
      mockGetAccount.mockResolvedValue(buildNetworkAccount(UNFUNDED_RECIPIENT, { balance: "0" }));

      expect(
        await isAmountValid(UNFUNDED_RECIPIENT, new BigNumber(ALGORAND_MIN_ACCOUNT_BALANCE)),
      ).toBe(true);
    });
  });

  describe("computeAlgoMaxSpendable", () => {
    it.each([
      ["send", 0, "900000"],
      ["send", 2, "700000"],
      ["optIn", 2, "600000"],
      ["claimReward", 1, "800000"],
    ] as const)(
      "keeps the base reserve for a %s with %i assets",
      (mode, nbAccountAssets, expected) => {
        const spendable = computeAlgoMaxSpendable({
          accountBalance: new BigNumber(1000000),
          nbAccountAssets,
          mode,
        });

        expect(spendable.toString()).toBe(expected);
      },
    );

    it("never goes below zero", () => {
      const spendable = computeAlgoMaxSpendable({
        accountBalance: new BigNumber(50000),
        nbAccountAssets: 3,
        mode: "send",
      });

      expect(spendable.toString()).toBe("0");
    });
  });
});
