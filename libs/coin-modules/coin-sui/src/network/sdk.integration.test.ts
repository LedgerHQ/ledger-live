import BigNumber from "bignumber.js";
import { getOperations } from "./sdk";
import type { Operation } from "@ledgerhq/types-live";

describe("getOperations", () => {
  describe("Account 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164", () => {
    // https://suiscan.xyz/mainnet/account/0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164/activity

    // 2 as of 23/03/2025
    const IN_OPERATIONS_COUNT = 1;
    const OUT_OPERATIONS_COUNT = 1;
    const TOTAL_OPERATIONS_COUNT = IN_OPERATIONS_COUNT + OUT_OPERATIONS_COUNT;

    let operations: Operation[];

    const testingAccount = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

    beforeAll(async () => {
      operations = await getOperations("mockAccoundId", testingAccount);
    });

    describe("List", () => {
      it("should fetch operations successfully", async () => {
        expect(Array.isArray(operations)).toBeDefined();
      });

      it("should fetch all operations", async () => {
        expect(operations.length).toBeGreaterThanOrEqual(TOTAL_OPERATIONS_COUNT);
      });

      it("should return the first operation at index 0 and the last at the end", async () => {
        const oldestTxHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
        const newestTxHash = "CnVCqFLDv9iJc3DPU2WGpJdZUjqFPhyEVJ5BAigEj9VW";
        expect(operations[operations.length - TOTAL_OPERATIONS_COUNT].hash).toEqual(newestTxHash);
        expect(operations[operations.length - 1].hash).toEqual(oldestTxHash);
      });
    });

    describe("Transaction types", () => {
      it("should return correct IN/OUT operations numbers", async () => {
        const inOps = operations.filter(op => op.type === "IN");
        const outOps = operations.filter(op => op.type === "OUT");
        expect(inOps.length).toBeGreaterThanOrEqual(IN_OPERATIONS_COUNT);
        expect(outOps.length).toBeGreaterThanOrEqual(OUT_OPERATIONS_COUNT);
      });

      describe("SUI operations", () => {
        it("should return SUI IN operations correctly", () => {
          // https://suiscan.xyz/mainnet/tx/rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg
          // Send 0.15 SUI to 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
          const txHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toMatchObject({
            type: "IN",
            value: BigNumber("150000000"),
            senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
            recipients: [testingAccount],
          });
        });
        it("should return SUI OUT operations correctly", () => {
          // https://suiscan.xyz/mainnet/tx/CnVCqFLDv9iJc3DPU2WGpJdZUjqFPhyEVJ5BAigEj9VW
          // Get 0.052 SUI from 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
          const txHash = "CnVCqFLDv9iJc3DPU2WGpJdZUjqFPhyEVJ5BAigEj9VW";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toMatchObject({
            type: "OUT",
            value: BigNumber("51747880"),
            recipients: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
            senders: [testingAccount],
          });
        });
      });
    });
  });
});
