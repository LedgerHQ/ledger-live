import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import BigNumber from "bignumber.js";
import { createMockERC20Transfer, TEST_ADDRESSES } from "../test/fixtures";
import { TxStatus } from "../types";
import { erc20TxnToOperation } from "./tokenAccounts";

setupMockCryptoAssetsStore();

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("erc20/tokenAccounts", () => {
  describe("erc20TxnToOperation", () => {
    it("should convert ERC20 send transaction to OUT operation", () => {
      const tx = createMockERC20Transfer({
        from: TEST_ADDRESSES.F4_ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F4,
        amount: "1000000000000000000",
        status: TxStatus.Ok,
      });

      const accountId = "accountId123";
      const ops = erc20TxnToOperation(tx, TEST_ADDRESSES.F4_ADDRESS, accountId);

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("OUT");
      expect(ops[0].value.isEqualTo(new BigNumber("1000000000000000000"))).toBe(true);
      expect(ops[0].accountId).toBe(accountId);
    });

    it("should convert ERC20 receive transaction to IN operation", () => {
      const tx = createMockERC20Transfer({
        from: TEST_ADDRESSES.F4_ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F4,
        amount: "500000000000000000",
      });

      const accountId = "accountId123";
      const ops = erc20TxnToOperation(tx, TEST_ADDRESSES.RECIPIENT_F4, accountId);

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("IN");
      expect(ops[0].value.isEqualTo(new BigNumber("500000000000000000"))).toBe(true);
    });

    it("should handle failed transaction", () => {
      const tx = createMockERC20Transfer({
        status: "Fail",
      });

      const ops = erc20TxnToOperation(tx, TEST_ADDRESSES.F4_ADDRESS, "accountId");

      expect(ops[0].hasFailed).toBe(true);
    });

    it("should handle self-transfer (both send and receive)", () => {
      const tx = createMockERC20Transfer({
        from: TEST_ADDRESSES.F4_ADDRESS,
        to: TEST_ADDRESSES.F4_ADDRESS,
      });

      const ops = erc20TxnToOperation(tx, TEST_ADDRESSES.F4_ADDRESS, "accountId");

      expect(ops).toHaveLength(2);
      expect(ops.some(op => op.type === "OUT")).toBe(true);
      expect(ops.some(op => op.type === "IN")).toBe(true);
    });
  });
});
