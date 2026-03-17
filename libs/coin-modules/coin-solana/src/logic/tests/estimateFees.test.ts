import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { estimateFees } from "../estimateFees";
import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc.mock";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function stubFeeEstimation(fee = 5000) {
  return rpcHandler({
    getLatestBlockhash: () => ({
      context: { slot: 100 },
      value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 280064048 },
    }),
    getFeeForMessage: () => ({ context: { slot: 100 }, value: fee }),
    simulateTransaction: () => ({
      context: { slot: 100 },
      value: { err: null, logs: [], unitsConsumed: 200 },
    }),
    getRecentPrioritizationFees: () => [],
    getMinimumBalanceForRentExemption: () => 2039280,
    getAccountInfo: () => ({
      context: { slot: 100 },
      value: {
        data: [
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
          "base64",
        ],
        executable: false,
        lamports: 1_000_000,
        owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        rentEpoch: 0,
        space: 82,
      },
    }),
  });
}

describe("estimateFees (MSW integration)", () => {
  it("should estimate fees for a native transfer intent via RPC", async () => {
    server.use(stubFeeEstimation(5000));

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1_000_000n,
      asset: { type: "native" },
    });

    expect(result.value).toBe(5000n);
  });

  it("should throw for unsupported intent types", async () => {
    await expect(
      estimateFees(api, {
        intentType: "staking",
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1_000_000n,
        asset: { type: "native" },
      } as TransactionIntent),
    ).rejects.toThrow("Unsupported intent type: staking");
  });

  describe("SPL Token fee estimation", () => {
    it("should estimate fees for SPL Token transfer — no error, fees higher than 0", async () => {
      server.use(stubFeeEstimation(5000));

      const result = await estimateFees(api, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1_000_000n,
        asset: { type: "spl-token", assetReference: USDC_MINT },
      });

      expect(result.value).toBeGreaterThan(0n);
    });
  });

  describe("Token-2022 fee estimation", () => {
    const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";

    it("should estimate fees for Token-2022 transfer — no error, fees higher than 0", async () => {
      server.use(stubFeeEstimation(5000));

      const result = await estimateFees(api, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1_000_000n,
        asset: { type: "spl-token-2022", assetReference: PYUSD_MINT },
      });

      expect(result.value).toBeGreaterThan(0n);
    });
  });
});
