import { v2 } from "@datadog/datadog-api-client";
import { monitor } from "./index";

describe("Coin Modules Monitoring", () => {
  describe("monitor", () => {
    it("sends logs to Datadog", async () => {
      const submitLogs = jest.spyOn(v2.LogsApi.prototype, "submitLog").mockResolvedValue({});

      await monitor([
        {
          duration: 200,
          currencyName: "solana",
          coinModuleName: "solana",
          operationType: "scan",
          accountType: "big",
          transactions: 1000,
          accountAddress: "0x1234",
        },
        {
          duration: 50,
          currencyName: "solana",
          coinModuleName: "solana",
          operationType: "scan",
          accountType: "average",
          transactions: 500,
          accountAddress: "0x5678",
        },
        {
          duration: 20,
          currencyName: "solana",
          coinModuleName: "solana",
          operationType: "scan",
          accountType: "pristine",
          transactions: 10,
          accountAddress: "0x9abc",
        },
      ]);

      expect(submitLogs).toHaveBeenCalledWith({
        body: [
          {
            ddtags: "env:prd",
            message: JSON.stringify({
              duration: 200,
              currencyName: "solana",
              coinModuleName: "solana",
              operationType: "scan",
              accountType: "big",
              transactions: 1000,
              accountAddress: "0x1234",
            }),
            service: "coin-modules-monitoring",
          },
          {
            ddtags: "env:prd",
            message: JSON.stringify({
              duration: 50,
              currencyName: "solana",
              coinModuleName: "solana",
              operationType: "scan",
              accountType: "average",
              transactions: 500,
              accountAddress: "0x5678",
            }),
            service: "coin-modules-monitoring",
          },
          {
            ddtags: "env:prd",
            message: JSON.stringify({
              duration: 20,
              currencyName: "solana",
              coinModuleName: "solana",
              operationType: "scan",
              accountType: "pristine",
              transactions: 10,
              accountAddress: "0x9abc",
            }),
            service: "coin-modules-monitoring",
          },
        ],
      });
    });
  });
});
