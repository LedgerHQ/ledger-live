import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction, VALID_ADDRESS } from "../test/fixtures";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../logic", () => ({
  estimateFees: jest.fn(),
}));

const { estimateFees } = jest.requireMock("../logic");

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: fee estimation returns 500 microCCD
    estimateFees.mockResolvedValue({ cost: BigInt(500), energy: BigInt(501) });
  });

  describe("fee calculation", () => {
    it("should update fee when current fee differs from estimate", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(1000), energy: BigInt(600) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(0) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN
      expect(result.fee).toEqual(new BigNumber(1000));
    });

    it("should return same transaction when fee is unchanged", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(500), energy: BigInt(501) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(500) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN - same reference = no change
      expect(result).toBe(tx);
    });

    it("should update fee when estimate changes", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(100) });
      estimateFees.mockResolvedValue({ cost: BigInt(200), energy: BigInt(501) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN
      expect(result.fee).toEqual(new BigNumber(200));
      expect(result).not.toBe(tx);
    });
  });

  describe("transaction type selection", () => {
    it("should call estimateFees without memo when no memo", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ memo: undefined });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      expect(estimateFees).toHaveBeenCalledWith(account.currency, undefined);
    });

    it("should call estimateFees with memo when memo is present", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ memo: "test memo" });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      expect(estimateFees).toHaveBeenCalledWith(account.currency, "test memo");
    });
  });

  describe("transaction immutability", () => {
    it("should not mutate original transaction", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(999), energy: BigInt(501) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(0) });
      const originalFee = tx.fee;

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      expect(tx.fee).toBe(originalFee);
    });

    it("should preserve other transaction fields when updating fee", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(999), energy: BigInt(501) });
      const account = createFixtureAccount();
      const tx = createFixtureTransaction({
        amount: new BigNumber(12345),
        recipient: VALID_ADDRESS,
        memo: "preserve me",
      });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN
      expect(result.amount).toEqual(new BigNumber(12345));
      expect(result.recipient).toBe(VALID_ADDRESS);
      expect(result.memo).toBe("preserve me");
    });
  });
});
