import BigNumber from "bignumber.js";
import { ABIContract, VIP180_ABI, VTHO_ADDRESS } from "@vechain/sdk-core";
import { calculateClausesVtho, calculateClausesVet } from "./calculateClauses";

describe("calculateClauses", () => {
  const testRecipient = "0x1234567890123456789012345678901234567890";
  const testAmount = new BigNumber("1000000000000000000"); // 1 VET/VTHO in wei

  describe("calculateClausesVtho", () => {
    it("should create correct VTHO transfer clause", async () => {
      const clauses = await calculateClausesVtho(testRecipient, testAmount);

      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toMatchObject({
        to: VTHO_ADDRESS,
        value: 0,
      });
      expect(clauses[0].data).toMatch(/^0x/);
      expect(clauses[0].data).not.toBe("0x");
    });

    it("should encode transfer function call in data field", async () => {
      const clauses = await calculateClausesVtho(testRecipient, testAmount);

      // The data should be the encoded function call for transfer(address,uint256)
      const expectedData = ABIContract.ofAbi(VIP180_ABI)
        .encodeFunctionInput("transfer", [testRecipient, testAmount.toFixed()])
        .toString();

      expect(clauses[0].data).toBe(expectedData);
    });

    it("should handle different amounts correctly", async () => {
      const amounts = [
        new BigNumber("1"), // 1 wei
        new BigNumber("1000"), // 1000 wei
        new BigNumber("1000000000000000000"), // 1 token
        new BigNumber("999999999999999999999999"), // large amount
      ];

      for (const amount of amounts) {
        const clauses = await calculateClausesVtho(testRecipient, amount);

        expect(clauses).toHaveLength(1);
        expect(clauses[0].to).toBe(VTHO_ADDRESS);
        expect(clauses[0].value).toBe(0);

        // Verify the amount is encoded correctly in the data
        const expectedData = ABIContract.ofAbi(VIP180_ABI)
          .encodeFunctionInput("transfer", [testRecipient, amount.toFixed()])
          .toString();
        expect(clauses[0].data).toBe(expectedData);
      }
    });

    it("should handle different recipients correctly", async () => {
      const recipients = [
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "0x0000000000000000000000000000000000000000",
        "0xffffffffffffffffffffffffffffffffffffffff",
      ];

      for (const recipient of recipients) {
        const clauses = await calculateClausesVtho(recipient, testAmount);

        expect(clauses).toHaveLength(1);
        expect(clauses[0].to).toBe(VTHO_ADDRESS);

        // Verify the recipient is encoded correctly in the data
        const expectedData = ABIContract.ofAbi(VIP180_ABI)
          .encodeFunctionInput("transfer", [recipient, testAmount.toFixed()])
          .toString();
        expect(clauses[0].data).toBe(expectedData);
      }
    });

    it("should handle integer amounts correctly", async () => {
      const integerAmount = new BigNumber("1500000000000000000"); // 1.5 * 10^18 as integer
      const clauses = await calculateClausesVtho(testRecipient, integerAmount);

      const expectedData = ABIContract.ofAbi(VIP180_ABI)
        .encodeFunctionInput("transfer", [testRecipient, integerAmount.toFixed()])
        .toString();

      expect(clauses[0].data).toBe(expectedData);
    });
  });

  describe("calculateClausesVet", () => {
    it("should create correct VET transfer clause", async () => {
      const clauses = await calculateClausesVet(testRecipient, testAmount);

      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toMatchObject({
        to: testRecipient,
        value: `0x${testAmount.toString(16)}`,
        data: "0x",
      });
    });

    it("should convert amount to hex correctly", async () => {
      const testCases = [
        { amount: new BigNumber("1"), expectedHex: "0x1" },
        { amount: new BigNumber("255"), expectedHex: "0xff" },
        { amount: new BigNumber("256"), expectedHex: "0x100" },
        { amount: new BigNumber("1000000000000000000"), expectedHex: "0xde0b6b3a7640000" },
      ];

      for (const testCase of testCases) {
        const clauses = await calculateClausesVet(testRecipient, testCase.amount);

        expect(clauses[0].value).toBe(testCase.expectedHex);
        expect(clauses[0].to).toBe(testRecipient);
        expect(clauses[0].data).toBe("0x");
      }
    });

    it("should handle different recipients correctly", async () => {
      const recipients = [
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "0x0000000000000000000000000000000000000000",
        "0xffffffffffffffffffffffffffffffffffffffff",
      ];

      for (const recipient of recipients) {
        const clauses = await calculateClausesVet(recipient, testAmount);

        expect(clauses).toHaveLength(1);
        expect(clauses[0].to).toBe(recipient);
        expect(clauses[0].value).toBe(`0x${testAmount.toString(16)}`);
        expect(clauses[0].data).toBe("0x");
      }
    });

    it("should handle zero amount", async () => {
      const zeroAmount = new BigNumber("0");
      const clauses = await calculateClausesVet(testRecipient, zeroAmount);

      expect(clauses[0].value).toBe("0x0");
      expect(clauses[0].to).toBe(testRecipient);
    });

    it("should handle very large amounts", async () => {
      const largeAmount = new BigNumber("999999999999999999999999");
      const clauses = await calculateClausesVet(testRecipient, largeAmount);

      expect(clauses[0].value).toBe(`0x${largeAmount.toString(16)}`);
      expect(clauses[0].to).toBe(testRecipient);
    });

    it("should maintain data field as empty hex", async () => {
      const clauses = await calculateClausesVet(testRecipient, testAmount);

      expect(clauses[0].data).toBe("0x");
    });
  });

  describe("return value structure", () => {
    it("should always return an array of clauses", async () => {
      const vthoResult = await calculateClausesVtho(testRecipient, testAmount);
      const vetResult = await calculateClausesVet(testRecipient, testAmount);

      expect(Array.isArray(vthoResult)).toBe(true);
      expect(Array.isArray(vetResult)).toBe(true);
      expect(vthoResult).toHaveLength(1);
      expect(vetResult).toHaveLength(1);
    });

    it("should return clauses with required VechainSDKTransactionClause structure", async () => {
      const vthoResult = await calculateClausesVtho(testRecipient, testAmount);
      const vetResult = await calculateClausesVet(testRecipient, testAmount);

      // Check VTHO clause structure
      expect(vthoResult[0]).toHaveProperty("to");
      expect(vthoResult[0]).toHaveProperty("value");
      expect(vthoResult[0]).toHaveProperty("data");

      // Check VET clause structure
      expect(vetResult[0]).toHaveProperty("to");
      expect(vetResult[0]).toHaveProperty("value");
      expect(vetResult[0]).toHaveProperty("data");
    });
  });
});
