import { getFeeRate } from "../getFeeRate";
import { networkHandler, server, testConfig, useMswServer } from "./helpers/msw";

useMswServer();

const rate = () => getFeeRate(testConfig(), { feesStrategy: "custom", feePerByte: 5n });

describe("getFeeRate incremental relay fee", () => {
  it.each([
    ["0.00001", 1n],
    ["0.00003", 3n],
    ["0.000025", 3n],
    ["0.000001", 1n],
  ])("converts %s BTC/kB to %s sat/vB, rounded up", async (incremental, expected) => {
    server.use(networkHandler("0.00001", undefined, incremental));
    expect((await rate()).incrementalRelayFeePerByte).toBe(expected);
  });

  it.each([null, ""])("defaults to 1 sat/vB when the explorer returns %p", async incremental => {
    server.use(networkHandler("0.00001", undefined, incremental));
    expect((await rate()).incrementalRelayFeePerByte).toBe(1n);
  });
});
