jest.mock("@ledgerhq/coin-evm/api", () => {
  const evmApiStub: Record<string, unknown> = { getBalance: jest.fn() };
  return { createApi: jest.fn(() => evmApiStub) };
});

jest.mock("./estimateFees", () => ({ estimateFees: jest.fn() }));

import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { estimateFees } from "./estimateFees";
import { createApi } from "./index";

const USDT = "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e";
const USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";
const SENDER = "0x7777777777777777777777777777777777777777";

const ctx: Context<EvmConfigInfo> = {
  config: async () => ({}) as EvmConfigInfo,
  logger: () => {},
};

const intent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: "0xb",
  amount: 1n,
  asset: { type: "native" },
  data: { type: "buffer", value: Buffer.from([]) },
} as unknown as Parameters<ReturnType<typeof createApi>["estimateFees"]>[1];

const evmGetBalance = () =>
  (createEvmApi as jest.Mock).mock.results[0].value.getBalance as jest.Mock;

describe("listFeeOptions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers standard plus the held allowlisted tokens read for the sender", async () => {
    const api = createApi("celo");
    evmGetBalance().mockResolvedValue([
      { value: 10n, asset: { type: "native" } },
      { value: 5n, asset: { type: "erc20", assetReference: USDC } },
      { value: 0n, asset: { type: "erc20", assetReference: USDT } },
      {
        value: 9n,
        asset: { type: "erc20", assetReference: "0x0000000000000000000000000000000000dead" },
      },
    ]);

    const options = await api.listFeeOptions(ctx, intent);

    expect(evmGetBalance()).toHaveBeenCalledWith(ctx, SENDER, {
      includeAssets: expect.any(Function),
    });
    expect(options.map(o => o.id)).toEqual(["standard", USDC.toLowerCase()]);
  });

  it("should only read balances of allowlisted fee tokens", async () => {
    const api = createApi("celo");
    evmGetBalance().mockResolvedValue([]);
    await api.listFeeOptions(ctx, intent);
    const { includeAssets } = evmGetBalance().mock.calls[0][2];

    await expect(includeAssets({ type: "erc20", assetReference: USDC })).resolves.toBe(true);
    await expect(
      includeAssets({ type: "erc20", assetReference: "0x0000000000000000000000000000000000dead" }),
    ).resolves.toBe(false);
    await expect(includeAssets({ type: "native" })).resolves.toBe(false);
  });

  it("propagates a balance read failure instead of degrading to standard", async () => {
    const api = createApi("celo");
    evmGetBalance().mockRejectedValue(new Error("rpc down"));

    await expect(api.listFeeOptions(ctx, intent)).rejects.toThrow("rpc down");
  });
});

describe("estimateFees wrapper", () => {
  const fee = { value: 1n };
  beforeEach(() => {
    jest.clearAllMocks();
    (estimateFees as jest.Mock).mockResolvedValue(fee);
  });

  it("forwards customFeesParameters (regression: they were dropped)", async () => {
    const api = createApi("celo");
    const customFeesParameters = { feeCurrency: USDC };

    await expect(api.estimateFees(ctx, intent, { customFeesParameters })).resolves.toBe(fee);

    expect(estimateFees).toHaveBeenCalledWith(intent, customFeesParameters);
  });

  it("maps feeOption to the CIP-64 fee currency (regression: it was dropped)", async () => {
    const api = createApi("celo");

    await api.estimateFees(ctx, intent, { feeOption: { feeOptionId: USDC.toLowerCase() } });

    expect(estimateFees).toHaveBeenCalledWith(intent, { feeCurrency: USDC_ADAPTER });
  });

  it("lets feeOption win over customFeesParameters.feeCurrency", async () => {
    const api = createApi("celo");

    await api.estimateFees(ctx, intent, {
      customFeesParameters: { feeCurrency: USDT, gasLimit: 7n },
      feeOption: { feeOptionId: USDC.toLowerCase() },
    });

    expect(estimateFees).toHaveBeenCalledWith(intent, {
      feeCurrency: USDC_ADAPTER,
      gasLimit: 7n,
    });
  });

  it("should price in CELO when feeOption is standard despite a raw feeCurrency", async () => {
    const api = createApi("celo");

    await api.estimateFees(ctx, intent, {
      customFeesParameters: { feeCurrency: USDC, gasLimit: 7n },
      feeOption: { feeOptionId: "standard" },
    });

    expect(estimateFees).toHaveBeenCalledWith(intent, { gasLimit: 7n });
  });

  it("should price in CELO when feeOption is unknown despite a raw feeCurrency", async () => {
    const api = createApi("celo");

    await api.estimateFees(ctx, intent, {
      customFeesParameters: { feeCurrency: USDC },
      feeOption: { feeOptionId: "bogus" },
    });

    expect(estimateFees).toHaveBeenCalledWith(intent, {});
  });
});
