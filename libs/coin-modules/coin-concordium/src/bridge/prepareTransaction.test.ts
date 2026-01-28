import BigNumber from "bignumber.js";
import { prepareTransaction } from "./prepareTransaction";
import {
  createFixtureBaseAccount,
  createFixtureTransaction,
  VALID_ADDRESS,
} from "./bridge.fixture";

jest.mock("../common-logic", () => ({
  estimateFees: jest.fn(),
}));

jest.mock("../common-logic/utils", () => ({
  encodeMemoToDataBlob: jest.fn().mockReturnValue({ data: Buffer.from("memo") }),
}));

const { estimateFees } = jest.requireMock("../common-logic");
const { encodeMemoToDataBlob } = jest.requireMock("../common-logic/utils");

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
      const account = createFixtureBaseAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(0) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN
      expect(result.fee).toEqual(new BigNumber(1000));
    });

    it("should return same transaction when fee is unchanged", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(500), energy: BigInt(501) });
      const account = createFixtureBaseAccount();
      const tx = createFixtureTransaction({ fee: new BigNumber(500) });

      // WHEN
      const result = await prepareTransaction(account, tx);

      // THEN - same reference = no change
      expect(result).toBe(tx);
    });

    it("should update fee when estimate changes", async () => {
      // GIVEN
      const account = createFixtureBaseAccount();
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
    it("should use Transfer type when no memo", async () => {
      // GIVEN
      const account = createFixtureBaseAccount();
      const tx = createFixtureTransaction({ memo: undefined });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN - AccountTransactionType.Transfer = 3
      expect(estimateFees).toHaveBeenCalledWith(
        "",
        account.currency,
        3,
        expect.objectContaining({
          amount: expect.anything(),
          toAddress: expect.anything(),
        }),
      );
      const payload = estimateFees.mock.calls[0][3];
      expect(payload).not.toHaveProperty("memo");
    });

    it("should use TransferWithMemo type when memo is present", async () => {
      // GIVEN
      const account = createFixtureBaseAccount();
      const tx = createFixtureTransaction({ memo: "test memo" });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN - AccountTransactionType.TransferWithMemo = 22
      expect(estimateFees).toHaveBeenCalledWith(
        "",
        account.currency,
        22,
        expect.objectContaining({
          memo: expect.anything(),
        }),
      );
      expect(encodeMemoToDataBlob).toHaveBeenCalledWith("test memo");
    });
  });

  describe("recipient address resolution", () => {
    it("should use recipient when provided", async () => {
      // GIVEN
      const recipientAddress = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";
      const account = createFixtureBaseAccount();
      const tx = createFixtureTransaction({ recipient: recipientAddress });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      const payload = estimateFees.mock.calls[0][3];
      expect(payload.toAddress.address).toBe(recipientAddress);
    });

    it("should use freshAddress when recipient is empty", async () => {
      // GIVEN
      const account = createFixtureBaseAccount({ freshAddress: VALID_ADDRESS });
      const tx = createFixtureTransaction({ recipient: "" });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      const payload = estimateFees.mock.calls[0][3];
      expect(payload.toAddress.address).toBe(VALID_ADDRESS);
    });

    it("should use abandon seed address when recipient and freshAddress are empty", async () => {
      // GIVEN
      const account = createFixtureBaseAccount({ freshAddress: "" });
      const tx = createFixtureTransaction({ recipient: "" });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN - should not throw, will use abandon seed address
      expect(estimateFees).toHaveBeenCalled();
    });
  });

  describe("amount handling", () => {
    it("should convert BigNumber amount to CcdAmount", async () => {
      // GIVEN
      const account = createFixtureBaseAccount();
      const tx = createFixtureTransaction({ amount: new BigNumber(5000000) }); // 5 CCD in microCCD

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      const payload = estimateFees.mock.calls[0][3];
      expect(payload.amount.microCcdAmount.toString()).toBe("5000000");
    });

    it("should handle zero amount", async () => {
      // GIVEN
      const account = createFixtureBaseAccount();
      const tx = createFixtureTransaction({ amount: new BigNumber(0) });

      // WHEN
      await prepareTransaction(account, tx);

      // THEN
      const payload = estimateFees.mock.calls[0][3];
      expect(payload.amount.microCcdAmount.toString()).toBe("0");
    });
  });

  describe("transaction immutability", () => {
    it("should not mutate original transaction", async () => {
      // GIVEN
      estimateFees.mockResolvedValue({ cost: BigInt(999), energy: BigInt(501) });
      const account = createFixtureBaseAccount();
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
      const account = createFixtureBaseAccount();
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
