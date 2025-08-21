import getDeviceTransactionConfig from "../../deviceTransactionConfig";
import { transaction } from "../fixtures/common.fixtures";

describe("deviceTransactionConfig", () => {
  describe("Kadena transaction", () => {
    it("should return the fields for a transaction", async () => {
      const res = getDeviceTransactionConfig({
        transaction,
      });
      expect(res).toEqual([
        {
          type: "amount",
          label: "Amount",
        },
        {
          type: "text",
          label: "Gas Limit",
          value: transaction.gasLimit.toString(),
        },
        {
          type: "text",
          label: "Gas Price",
          value: transaction.gasPrice.toString(),
        },
      ]);
    });
  });
});
