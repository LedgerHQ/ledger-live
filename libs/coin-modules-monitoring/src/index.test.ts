import { v2 } from "@datadog/datadog-api-client";
import { monitor } from "./index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

describe("Coin Modules Monitoring", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe("monitor", () => {
    it("sends logs to Datadog", async () => {
      const submitLogs = jest.spyOn(v2.LogsApi.prototype, "submitLog").mockResolvedValue({});
      jest
        .spyOn(Date, "now")
        .mockReturnValueOnce(3000) // Start scan big
        .mockReturnValueOnce(3200) // End scan big
        .mockReturnValueOnce(3000) // Start sync big
        .mockReturnValueOnce(3100) // End sync big
        .mockReturnValueOnce(3000) // Start scan average
        .mockReturnValueOnce(3050) // End scan average
        .mockReturnValueOnce(3000) // Start sync average
        .mockReturnValueOnce(3025) // End sync average
        .mockReturnValueOnce(3000) // Start scan pristine
        .mockReturnValueOnce(3020) // End scan pristine
        .mockReturnValueOnce(3000) // Start sync pristine
        .mockReturnValueOnce(3010); // End sync pristine

      await monitor(
        { id: "solana", family: "solana" } as CryptoCurrency,
        {
          big: { address: "0x1234" },
          average: { address: "0x5678" },
          pristine: { address: "0x9abc" },
        },
        async info => {
          const operationsCounts: Record<string, number> = {
            "0x1234": 1000,
            "0x5678": 500,
            "0x9abc": 0,
          };
          const xPubs: Record<string, string> = {
            "0x9abc": "0xpub",
          };
          return {
            xpub: xPubs[info.address],
            operationsCount: operationsCounts[info.address],
          };
        },
      );

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
              accountAddressOrXpub: "0x1234",
            }),
            service: "coin-modules-monitoring",
          },
          {
            ddtags: "env:prd",
            message: JSON.stringify({
              duration: 100,
              currencyName: "solana",
              coinModuleName: "solana",
              operationType: "sync",
              accountType: "big",
              transactions: 1000,
              accountAddressOrXpub: "0x1234",
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
              accountAddressOrXpub: "0x5678",
            }),
            service: "coin-modules-monitoring",
          },
          {
            ddtags: "env:prd",
            message: JSON.stringify({
              duration: 25,
              currencyName: "solana",
              coinModuleName: "solana",
              operationType: "sync",
              accountType: "average",
              transactions: 500,
              accountAddressOrXpub: "0x5678",
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
              transactions: 0,
              accountAddressOrXpub: "0xpub",
            }),
            service: "coin-modules-monitoring",
          },
          {
            ddtags: "env:prd",
            message: JSON.stringify({
              duration: 10,
              currencyName: "solana",
              coinModuleName: "solana",
              operationType: "sync",
              accountType: "pristine",
              transactions: 0,
              accountAddressOrXpub: "0xpub",
            }),
            service: "coin-modules-monitoring",
          },
        ],
      });
    });
  });
});
