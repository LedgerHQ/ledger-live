import BigNumber from "bignumber.js";
import { createSingleAddressAccountModule } from "@ledgerhq/account-module-single-address";
import { FeeTooLow } from "@ledgerhq/coin-bitcoin/errors";
import {
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/coin-module-framework/errors";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { XrpDestinationTagRequired } from "@ledgerhq/coin-xrp/types";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import type { Operation } from "@ledgerhq/types-live";
import { extractBalances } from "../utils";
import {
  ADDRESS,
  ADDRESS_PATH,
  BITCOIN_ACCOUNT_ID,
  bitcoin,
  bitcoinAccount,
  CRAFTED_OPERATION,
  fakeAccountModule,
  fakeBinding,
  fakeCoinModule,
  liveOperation,
  mockLiveConfig,
  portfolioCoinConfig,
  ripple,
  RIPPLE_ACCOUNT_ID,
  rippleAccount,
  serviceStandIn,
  standInNetwork,
  XPUB,
  type FakeCoinModule,
  type SpiedPortfolio,
} from "../tests/portfolioFixtures";
import {
  accountSource,
  portfolioBroadcast,
  portfolioIntentApi,
  toIntentView,
  toWireForm,
  unvalidatedStatus,
  writeIntentApi,
} from "./intentApi";

jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));

const context = { config: async () => ({}), logger: () => undefined } as never;

/** A coin module intent, with the family fields (memo, data, ...) a family adds. */
type Intent = TransactionIntent & Record<string, unknown>;

const intent = (fields: Record<string, unknown> = {}): Intent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: "address-of-the-intent",
    senderPublicKey: "02pub",
    recipient: "rRecipient",
    amount: 100n,
    asset: { type: "native", name: "XRP" },
    sequence: 9n,
    useAllAmount: false,
    memo: { type: "string", kind: "text", value: "hi" },
    fee: 12n,
    unset: undefined,
    ...fields,
  }) as Intent;

const TRC20 = { type: "trc20", assetReference: "TUsdt", assetOwner: "TOwner", name: "Tether" };
/** A Cardano token: the catalog types it "native", its reference tells it apart. */
const CARDANO_TOKEN = { type: "native", assetReference: "policy.token", name: "Token" };

type ViewOptions = Parameters<typeof toIntentView>[1];

const view = (fields: Partial<ViewOptions> = {}): ViewOptions => ({
  sender: ADDRESS,
  feeParameters: undefined,
  accountOptions: undefined,
  mode: "local",
  ...fields,
});

function configure(
  mode: "local" | "hybrid" | "remote" | undefined,
  url = "https://portfolio.test",
) {
  mockLiveConfig({
    config_portfolio_service: { url },
    ...(mode === undefined
      ? {}
      : {
          config_currency_ripple: portfolioCoinConfig(mode),
          config_currency_bitcoin: portfolioCoinConfig(mode),
        }),
  });
}

let coinModule: FakeCoinModule;

beforeEach(() => {
  jest.clearAllMocks();
  coinModule = fakeCoinModule();
});

afterEach(() => jest.restoreAllMocks());

describe("accountSource", () => {
  it("serves an account module account by its extended public key and account path", () => {
    const account = bitcoinAccount({ index: 2, freshAddressPath: "84'/0'/2'/1/7" });
    expect(accountSource(fakeBinding(fakeAccountModule()), account)).toEqual({
      currency: bitcoin,
      accountId: BITCOIN_ACCOUNT_ID,
      key: XPUB,
      derivationMode: "native_segwit",
      derivationPath: "84'/0'/2'",
      index: 2,
      account,
    });
  });

  it("serves a single-address account by its address and address path", () => {
    const account = rippleAccount();
    expect(accountSource(undefined, account)).toEqual({
      currency: ripple,
      accountId: RIPPLE_ACCOUNT_ID,
      key: ADDRESS,
      derivationMode: "",
      derivationPath: ADDRESS_PATH,
      index: 0,
      account,
    });
  });
});

describe("toWireForm", () => {
  it("gives a map, bytes and a BigNumber the form JSON has none for, anywhere", () => {
    expect(
      toWireForm({
        memo: { type: "map", memos: new Map([["destinationTag", "1234"]]) },
        data: { type: "buffer", value: Buffer.from([0xa9, 0x05]) },
        bytes: [new Uint8Array([1, 255])],
        gas: new BigNumber("1e22"),
      }),
    ).toEqual({
      memo: { type: "map", memos: { destinationTag: "1234" } },
      data: { type: "buffer", value: "a905" },
      bytes: ["01ff"],
      gas: "10000000000000000000000",
    });
  });

  it("leaves what JSON safety handles as it is", () => {
    const date = new Date("2026-10-01T00:00:00Z");
    expect(toWireForm({ amount: 5n, date, none: null, text: "t", flag: true })).toEqual({
      amount: 5n,
      date,
      none: null,
      text: "t",
      flag: true,
    });
  });

  it("fails on any other collection rather than dropping it", () => {
    expect(() => toWireForm({ set: new Set([1]) })).toThrow(
      "No wire form for a Set in the intent of the service",
    );
    expect(() => toWireForm([new Uint16Array([1])])).toThrow(
      "No wire form for a Uint16Array in the intent of the service",
    );
  });
});

describe("toIntentView when the client writes", () => {
  it.each(["local", "hybrid"] as const)(
    "carries the asset, the intent type and every other field as it is (%s)",
    mode => {
      const result = toIntentView(
        intent({ sequence: -1n, feesStrategy: "slow" }),
        view({
          mode,
          feeParameters: { feesStrategy: "fast", gasLimit: 21_000n },
          accountOptions: { strategy: 1 },
        }),
      );
      expect(result).toEqual({
        type: "send",
        sender: ADDRESS,
        senderPublicKey: "02pub",
        recipient: "rRecipient",
        amount: "100",
        asset: "native",
        // Native included: the coin module gets the name and unit it gets on the legacy path.
        assetInfo: { type: "native", name: "XRP" },
        intentType: "transaction",
        networkParams: {
          // The intent's own sequence and fees strategy, whatever they are.
          sequence: -1n,
          feesStrategy: "slow",
          useAllAmount: false,
          memo: { type: "string", kind: "text", value: "hi" },
          fee: 12n,
          accountOptions: { strategy: 1 },
          feeParameters: { feesStrategy: "fast", gasLimit: 21_000n },
        },
      });
      // The fees strategy rides the fee parameters only: the modules get the options legacy passes.
      expect(result).not.toHaveProperty("feesStrategy");
      // Presence is exact: a key the intent leaves undefined stays, as legacy passes it.
      expect(Object.keys(result.networkParams as object)).toContain("unset");
    },
  );

  it("keeps the staking fields, the data and the memo with their exact presence", () => {
    const data = { type: "buffer", value: Buffer.from([0xa9]) };
    const { networkParams, intentType } = toIntentView(
      intent({
        intentType: "staking",
        mode: "delegate",
        valAddress: "validator",
        dstValAddress: undefined,
        data,
      }),
      view({ feeParameters: {} }),
    );
    expect(intentType).toBe("staking");
    expect(networkParams).toMatchObject({ mode: "delegate", valAddress: "validator", data });
    expect(Object.keys(networkParams as object)).toContain("dstValAddress");
    // Fee options present, even empty, wherever the call has some.
    expect(networkParams).toHaveProperty("feeParameters", {});
  });

  it("carries no fee parameters nor account options the call does not have", () => {
    const { networkParams } = toIntentView(intent(), view({}));
    expect(networkParams).not.toHaveProperty("feeParameters");
    expect(networkParams).not.toHaveProperty("accountOptions");
  });

  it("keeps an empty public key and recipient, and leaves out an absent one", () => {
    expect(toIntentView(intent({ senderPublicKey: "", recipient: "" }), view({}))).toMatchObject({
      senderPublicKey: "",
      recipient: "",
    });
    const { senderPublicKey: _key, recipient: _recipient, ...bare } = intent();
    const result = toIntentView(bare as Intent, view({}));
    expect(result).not.toHaveProperty("senderPublicKey");
    expect(result).not.toHaveProperty("recipient");
  });

  it("keys an asset by its reference first, then native, then its type", () => {
    const assetOf = (asset: object) => toIntentView(intent({ asset }), view({}));
    expect(assetOf(TRC20)).toMatchObject({ asset: "TUsdt", assetInfo: TRC20 });
    expect(assetOf(CARDANO_TOKEN)).toMatchObject({ asset: "policy.token" });
    expect(assetOf({ type: "erc20", assetReference: "" }).asset).toBe("erc20");
    expect(assetOf({ type: "trc10" }).asset).toBe("trc10");
  });
});

describe("toIntentView when the service writes", () => {
  it("sends the common fields and networkParams in their wire form", () => {
    expect(
      toIntentView(
        intent({ data: { type: "buffer", value: Buffer.from([0xa9]) } }),
        view({
          mode: "remote",
          accountOptions: { replaced: 3n },
          feeParameters: { feesStrategy: "fast", maxFeePerGas: 7n },
        }),
      ),
    ).toEqual({
      type: "send",
      sender: ADDRESS,
      senderPublicKey: "02pub",
      recipient: "rRecipient",
      amount: "100",
      asset: "native",
      feesStrategy: "fast",
      networkParams: {
        useAllAmount: false,
        memo: { type: "string", kind: "text", value: "hi" },
        fee: "12",
        sequence: "9",
        data: { type: "buffer", value: "a9" },
        accountOptions: { replaced: "3" },
        feeParameters: { feesStrategy: "fast", maxFeePerGas: "7" },
      },
    });
  });

  it("leaves a sequence it does not have, or a negative one, to the service", () => {
    const paramsOf = (sequence: unknown) =>
      toIntentView(intent({ sequence }), view({ mode: "remote" })).networkParams;
    expect(paramsOf(undefined)).not.toHaveProperty("sequence");
    expect(paramsOf(-1n)).not.toHaveProperty("sequence");
    expect(paramsOf(0n)).toHaveProperty("sequence", "0");
  });

  it("keeps the destination tag of a map memo", () => {
    const memo = { type: "map", memos: new Map([["destinationTag", "1234"]]) };
    const { networkParams } = toIntentView(intent({ memo }), view({ mode: "remote" }));
    // What the service receives is JSON: the tag must survive the serialization.
    expect(JSON.stringify(networkParams)).toContain("1234");
    expect(networkParams).toMatchObject({ memo: { memos: { destinationTag: "1234" } } });
  });

  it("takes the fees strategy of the fee parameters, else the intent's, when the service knows it", () => {
    const strategyOf = (fields: Record<string, unknown>, feeParameters?: Record<string, unknown>) =>
      toIntentView(intent(fields), view({ mode: "remote", feeParameters }));
    expect(strategyOf({ feesStrategy: "slow" }).feesStrategy).toBe("slow");
    expect(strategyOf({ feesStrategy: "medium" }, { feesStrategy: "custom" }).feesStrategy).toBe(
      "medium",
    );
    expect(strategyOf({ feesStrategy: "custom" }, { feesStrategy: 3 })).not.toHaveProperty(
      "feesStrategy",
    );
  });

  it("carries neither the asset nor the intent type, and drops an empty public key or recipient", () => {
    const result = toIntentView(
      intent({ senderPublicKey: "", recipient: "", asset: TRC20 }),
      view({ mode: "remote" }),
    );
    expect(result.asset).toBe("TUsdt");
    for (const field of ["assetInfo", "intentType", "senderPublicKey", "recipient"]) {
      expect(result).not.toHaveProperty(field);
    }
  });
});

describe("unvalidatedStatus", () => {
  it("blocks nothing, spending the fee the client set on top of a native amount", () => {
    expect(unvalidatedStatus(intent(), 15n)).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: 15n,
      amount: 100n,
      totalSpent: 115n,
    });
  });

  it("counts no fee without one, and none on top of a token amount", () => {
    expect(unvalidatedStatus(intent(), undefined)).toMatchObject({
      estimatedFees: 0n,
      totalSpent: 100n,
    });
    for (const asset of [TRC20, CARDANO_TOKEN]) {
      expect(unvalidatedStatus(intent({ asset }), 15n)).toMatchObject({
        estimatedFees: 15n,
        amount: 100n,
        totalSpent: 100n,
      });
    }
  });
});

describe("portfolioIntentApi of a single-address account, local mode", () => {
  beforeEach(() => configure("local"));

  const writeApi = (fields: Partial<Parameters<typeof portfolioIntentApi>[0]> = {}) =>
    portfolioIntentApi({
      binding: undefined,
      coinModuleApi: coinModule as never,
      account: rippleAccount({
        balance: new BigNumber(1_000),
        spendableBalance: new BigNumber(1_000),
      }),
      transaction: {},
      ...fields,
    });

  it("leaves the data to the side writing", () => {
    expect(writeApi().craftTransactionData(context, intent())).toBeUndefined();
    expect(coinModule.craftTransactionData).not.toHaveBeenCalled();
  });

  it("takes the network sequence from the side writing", async () => {
    await expect(writeApi().getNextSequence(context, ADDRESS)).resolves.toBe(7n);
    // Asked by the local side, with its own context, not the bridge's.
    expect(coinModule.getNextSequence).toHaveBeenCalledWith(expect.anything(), ADDRESS);
    expect((coinModule.getNextSequence.mock.calls[0] as unknown[])[0]).not.toBe(context);
  });

  it("validates through the local side as the legacy path does, with the balances it seeded", async () => {
    const pending = liveOperation({
      type: "OUT",
      hash: "pending",
      value: new BigNumber(200),
      blockHeight: undefined,
    }) as Operation;
    const account = rippleAccount({
      balance: new BigNumber(1_000),
      spendableBalance: new BigNumber(900),
      pendingOperations: [pending],
    });
    const notCreated = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: "10 XRP",
    });
    coinModule.validateIntent.mockResolvedValue({
      errors: { amount: notCreated },
      warnings: { recipient: new XrpDestinationTagRequired() },
      estimatedFees: 12n,
      totalFees: 12n,
      amount: 100n,
      totalSpent: 112n,
    } as never);
    const options = { customFees: { value: 15n, parameters: { feesStrategy: "fast" } } };
    const legacyIntent = intent({ sender: ADDRESS, data: { type: "none" } });

    const validation = await writeApi({ account }).validateIntent(
      context,
      intent({ sender: ADDRESS, data: undefined }),
      // Not used: the local side validates with the state Ledger Wallet seeded.
      [],
      options,
    );

    // The coin module gets what the legacy path hands it: the intent, its data completed, the
    // balances of the account (reserve and pending spend locked) and the fee options.
    expect(coinModule.validateIntent).toHaveBeenCalledWith(
      expect.anything(),
      { ...legacyIntent, asset: { type: "native", name: "XRP" } },
      extractBalances(account),
      options,
    );
    expect(coinModule.craftTransactionData).toHaveBeenCalledTimes(1);
    // The errors are those the coin module threw, revived.
    expect(validation).toEqual({
      errors: { amount: expect.any(NotEnoughBalanceBecauseDestinationNotCreated) },
      warnings: { recipient: expect.any(XrpDestinationTagRequired) },
      estimatedFees: 12n,
      totalFees: 12n,
      amount: 100n,
      totalSpent: 112n,
    });
    expect(validation.errors.amount).toMatchObject({ minimalAmount: "10 XRP" });
  });

  it("validates without custom fees when the call has none", async () => {
    await writeApi().validateIntent(context, intent(), [], undefined);
    expect(coinModule.validateIntent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amount: 100n }),
      expect.any(Array),
      {},
    );
  });

  it("fails as the local side does, even when it does not serve the validation", async () => {
    const unsupported = new PortfolioApiError("METHOD_NOT_ALLOWED", "validateIntent");
    coinModule.validateIntent.mockRejectedValue(unsupported);
    await expect(writeApi().validateIntent(context, intent(), [], undefined)).rejects.toBe(
      unsupported,
    );
  });

  it.each([
    ["a token transfer", { asset: TRC20 }, { asset: TRC20 }],
    [
      "a staking intent",
      { intentType: "staking", mode: "delegate", valAddress: "validator" },
      { intentType: "staking", mode: "delegate", valAddress: "validator" },
    ],
  ])("writes %s the coin module gets as it is", async (_name, fields, expected) => {
    const api = writeApi();
    await api.estimateFees(context, intent(fields), { customFeesParameters: {} });
    expect(coinModule.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(expected),
      { customFeesParameters: {} },
    );
    await api.craftTransaction(context, intent(fields), {
      customFees: { value: 15n, parameters: {} },
    });
    expect(coinModule.craftTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(expected),
      { customFees: { value: 15n, parameters: {} } },
    );
  });

  it("estimates a send-max without fee options, as the legacy path", async () => {
    await writeApi().estimateFees(context, intent({ useAllAmount: true }));
    expect(coinModule.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ useAllAmount: true }),
      undefined,
    );
  });
});

describe("portfolioIntentApi of an account module account, local mode", () => {
  beforeEach(() => configure("local"));

  it("estimates, validates, crafts and combines through the account module, on one portfolio", async () => {
    const module = fakeAccountModule();
    module.validateIntent.mockResolvedValue({
      errors: { fee: new FeeTooLow() },
      warnings: {},
      estimatedFees: 1_000n,
      amount: 50_000n,
      totalSpent: 51_000n,
    });
    const binding = fakeBinding(module);
    const api = portfolioIntentApi({
      binding,
      coinModuleApi: coinModule as never,
      account: bitcoinAccount(),
      transaction: { utxoStrategy: { strategy: 0 } },
    });
    // Nothing opens before a write.
    expect(binding.create).not.toHaveBeenCalled();

    await expect(
      api.estimateFees(context, intent(), { customFeesParameters: { feesStrategy: "fast" } }),
    ).resolves.toEqual({ value: 1_000n, parameters: { amount: "49000" } });
    expect(module.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ descriptor: expect.objectContaining({ key: XPUB }) }),
      expect.objectContaining({
        type: "send",
        recipient: "rRecipient",
        amount: 100n,
        accountOptions: { strategy: 0 },
      }),
      { customFeesParameters: { feesStrategy: "fast" } },
    );
    // The fees strategy reaches the module as the legacy path passes it: in the fee options only.
    expect(module.estimateFees.mock.calls[0][2]).not.toHaveProperty("feesStrategy");

    const customFees = { value: 1_000n, parameters: { feePerByte: 3n } };
    const validation = await api.validateIntent(context, intent(), [], { customFees });
    expect(validation.errors.fee).toBeInstanceOf(FeeTooLow);
    expect(module.validateIntent).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ accountOptions: { strategy: 0 } }),
      { customFees },
    );

    // The account module's operation comes back with the crafted transaction.
    await expect(
      api.craftTransaction(context, intent(), {
        customFees: { value: 1_500n, parameters: { feesStrategy: "slow", feePerByte: 3n } },
      }),
    ).resolves.toEqual({
      transaction: "psbt",
      details: { inputs: "2" },
      operation: CRAFTED_OPERATION,
    });
    expect(module.craftTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.not.objectContaining({ feeParameters: expect.anything() }),
      { customFees: { value: 1_500n, parameters: { feesStrategy: "slow", feePerByte: 3n } } },
    );

    await expect(api.combine(context, "psbt", ["device-sig"], { pubkey: "pk" })).resolves.toBe(
      "signed-psbt",
    );
    // Only the instance that crafted the transaction can combine it through the account module.
    expect(module.combine).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ transaction: "psbt", operation: CRAFTED_OPERATION }),
      ["device-sig"],
      { pubkey: "pk" },
    );
    expect(binding.create).toHaveBeenCalledTimes(1);
  });
});

describe("portfolioIntentApi of a single-address account, remote mode", () => {
  let serviceCoinModule: FakeCoinModule;
  let service: SpiedPortfolio;

  beforeEach(() => {
    configure("remote");
    serviceCoinModule = fakeCoinModule({
      estimateFees: jest.fn(async () => ({ value: 15n })),
      craftTransaction: jest.fn(async (_context, { sequence }) => ({
        transaction: `service-unsigned-${sequence}`,
        details: { size: 10n },
      })),
    });
    service = serviceStandIn(
      "xrp",
      standInNetwork(
        ripple,
        serviceCoinModule,
        createSingleAddressAccountModule(serviceCoinModule as never),
        "static",
      ),
    );
    (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);
  });

  const writeApi = () =>
    portfolioIntentApi({
      binding: undefined,
      coinModuleApi: coinModule as never,
      account: rippleAccount(),
      transaction: {},
    });

  /** The portfolio-service: it serves no validation. */
  const withoutValidation = () => delete (service as Partial<SpiedPortfolio>).validateTransaction;

  it("writes through the service, which takes the sequence, then broadcasts there", async () => {
    const api = writeApi();

    // The network sequence the service tells.
    await expect(api.getNextSequence(context, ADDRESS)).resolves.toBe(7n);
    expect(service.getNextSequence).toHaveBeenCalledWith("xrp", ADDRESS);

    await expect(api.estimateFees(context, intent())).resolves.toEqual({ value: 15n });
    expect(serviceCoinModule.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sender: ADDRESS, amount: 100n, fee: "12", sequence: "9" }),
      undefined,
    );

    await expect(api.craftTransaction(context, intent())).resolves.toEqual({
      transaction: "service-unsigned-9",
      details: { size: "10" },
    });
    expect(service.encodeTransaction).toHaveBeenCalledWith("xrp", { intent: expect.any(Object) });
    await expect(api.combine(context, "service-unsigned-9", ["device-sig"])).resolves.toBe(
      "service-unsigned-9+device-sig",
    );
    expect(service.combineTransaction).toHaveBeenCalledWith("xrp", {
      rawTransaction: "service-unsigned-9",
      signature: "device-sig",
    });
    expect(createPortfolioServiceClient).toHaveBeenCalledTimes(1);
    // A write needs no portfolio on the service.
    expect(service.getPortfolio).not.toHaveBeenCalled();
    expect(service.addRegistrations).not.toHaveBeenCalled();

    await expect(
      portfolioBroadcast(
        undefined,
        coinModule as never,
        rippleAccount(),
        "service-unsigned-9+device-sig",
      ),
    ).resolves.toBe("broadcast-hash");
    // No broadcast config: the module gets none.
    expect(serviceCoinModule.broadcast).toHaveBeenCalledWith(
      expect.anything(),
      "service-unsigned-9+device-sig",
      undefined,
    );
    // Nothing reaches the client's own coin module.
    for (const method of [
      "getNextSequence",
      "estimateFees",
      "craftTransaction",
      "combine",
      "broadcast",
    ] as const) {
      expect(coinModule[method]).not.toHaveBeenCalled();
    }
  });

  it("answers an unvalidated status when the service serves no validation", async () => {
    withoutValidation();
    const api = writeApi();
    const customFees = { value: 15n, parameters: {} };

    await expect(api.validateIntent(context, intent(), [], { customFees })).resolves.toEqual(
      unvalidatedStatus(intent(), 15n),
    );
    await expect(
      api.validateIntent(context, intent({ asset: TRC20 }), [], undefined),
    ).resolves.toEqual({
      errors: {},
      warnings: {},
      estimatedFees: 0n,
      amount: 100n,
      totalSpent: 100n,
    });
    // Never validated around the portfolio layer.
    expect(coinModule.validateIntent).not.toHaveBeenCalled();
    expect(serviceCoinModule.validateIntent).not.toHaveBeenCalled();
  });

  it("revives the validation of a service that serves one", async () => {
    serviceCoinModule.validateIntent.mockResolvedValue({
      errors: { amount: new NotEnoughBalance() },
      warnings: {},
      estimatedFees: 15n,
      amount: 100n,
      totalSpent: 115n,
    });
    const validation = await writeApi().validateIntent(context, intent(), [], {
      customFees: { value: 15n, parameters: {} },
    });

    expect(service.validateTransaction).toHaveBeenCalledWith("xrp", {
      intent: expect.objectContaining({
        networkParams: expect.objectContaining({ feeParameters: {} }),
      }),
      customFees: "15",
    });
    expect(validation.errors.amount).toBeInstanceOf(NotEnoughBalance);
    expect(validation).toMatchObject({ estimatedFees: 15n, amount: 100n, totalSpent: 115n });
  });

  it("fails as the service does otherwise", async () => {
    const down = new PortfolioApiError("UNAVAILABLE", "service down");
    (service.validateTransaction as jest.Mock).mockRejectedValue(down);
    await expect(writeApi().validateIntent(context, intent(), [], undefined)).rejects.toBe(down);
  });

  it.each([
    ["a token transfer", { asset: TRC20 }, "transaction intents on trc20 assets"],
    ["a Cardano token transfer", { asset: CARDANO_TOKEN }, "transaction intents on native assets"],
    ["a staking intent", { intentType: "staking" }, "staking intents on native assets"],
  ])(
    "refuses %s, which the service would sign as a native transfer",
    async (_name, fields, what) => {
      const api = writeApi();
      const refused = `ripple: ${what} are not served by the portfolio-service`;

      await expect(api.estimateFees(context, intent(fields))).rejects.toThrow(refused);
      await expect(api.craftTransaction(context, intent(fields))).rejects.toThrow(refused);
      expect(service.estimateTransactionFee).not.toHaveBeenCalled();
      expect(service.encodeTransaction).not.toHaveBeenCalled();
    },
  );

  it("refuses to write an account served by an account module, whose key is an xpub", async () => {
    withoutValidation();
    const module = fakeAccountModule();
    const api = portfolioIntentApi({
      binding: fakeBinding(module),
      coinModuleApi: coinModule as never,
      account: bitcoinAccount(),
      transaction: {},
    });
    const refused =
      "bitcoin: accounts served by an account module are not written by the portfolio-service (use the hybrid mode)";

    await expect(api.estimateFees(context, intent())).rejects.toThrow(refused);
    await expect(api.craftTransaction(context, intent())).rejects.toThrow(refused);
    // The status stays unvalidated, as for any account the service writes.
    await expect(api.validateIntent(context, intent(), [], undefined)).resolves.toEqual(
      unvalidatedStatus(intent(), undefined),
    );
    expect(service.estimateTransactionFee).not.toHaveBeenCalled();
    expect(service.encodeTransaction).not.toHaveBeenCalled();
    expect(module.estimateFees).not.toHaveBeenCalled();
    expect(module.craftTransaction).not.toHaveBeenCalled();
  });
});

describe("portfolioIntentApi crafting without details", () => {
  it("answers the transaction alone", async () => {
    configure("remote");
    const serviceCoinModule = fakeCoinModule({
      craftTransaction: jest.fn(async () => ({ transaction: "bare" })),
    });
    (createPortfolioServiceClient as jest.Mock).mockReturnValue(
      serviceStandIn(
        "xrp",
        standInNetwork(
          ripple,
          serviceCoinModule,
          createSingleAddressAccountModule(serviceCoinModule as never),
          "static",
        ),
      ),
    );
    const api = writeIntentApi({}, coinModule as never, rippleAccount(), {});

    await expect(api.craftTransaction(context, intent())).resolves.toEqual({
      transaction: "bare",
    });
  });

  it("keeps only the details the service answers as an object, as they are", async () => {
    configure("remote");
    const encodeTransaction = jest.fn();
    (createPortfolioServiceClient as jest.Mock).mockReturnValue({ encodeTransaction });
    const craft = async (details: unknown) => {
      encodeTransaction.mockResolvedValueOnce({ rawTransaction: "raw", details });
      const api = writeIntentApi({}, coinModule as never, rippleAccount(), {});
      return api.craftTransaction(context, intent());
    };

    // JSON gives an absent field as null.
    for (const details of [null, "str", ["a"]]) {
      await expect(craft(details)).resolves.toEqual({ transaction: "raw" });
    }
    // The service answers no crafted operation: an `operation` it sends is one of its details.
    const operation = { id: "service-op" };
    await expect(craft({ operation, x: 1 })).resolves.toEqual({
      transaction: "raw",
      details: { operation, x: 1 },
    });
  });

  it("answers the details alone when the local side answers no crafted operation", async () => {
    configure("hybrid");
    const module = fakeAccountModule();
    // What the local side answers for a transaction its coin module crafts.
    module.craftTransaction.mockResolvedValue({
      transaction: "psbt",
      details: { inputs: 2n },
    } as never);
    const api = writeIntentApi(
      { accountModule: fakeBinding(module) },
      coinModule as never,
      bitcoinAccount(),
      {},
    );

    await expect(api.craftTransaction(context, intent())).resolves.toEqual({
      transaction: "psbt",
      details: { inputs: "2" },
    });
  });
});

describe("writeIntentApi", () => {
  it("is the legacy write path while the coin config does not enable the portfolio", async () => {
    configure(undefined);
    expect(writeIntentApi({}, coinModule as never, rippleAccount(), {})).toBe(coinModule);

    const module = fakeAccountModule();
    const api = writeIntentApi(
      { accountModule: fakeBinding(module) },
      coinModule as never,
      bitcoinAccount(),
      {},
    );
    await api.estimateFees(context, intent());
    expect(module.estimateFees).toHaveBeenCalledWith(
      context,
      expect.anything(),
      intent(),
      undefined,
    );
  });

  it("goes through the portfolio when the coin config enables it, seeded with the family's tokens", async () => {
    configure("local");
    const token = { id: "ripple/token/usd", units: [{ magnitude: 6 }] };
    const tokenAsset = { type: "token", assetReference: "USD.rIssuer", assetOwner: "rIssuer" };
    const getAssetFromToken = jest.fn(() => tokenAsset);
    const account = rippleAccount({
      balance: new BigNumber(1_000),
      spendableBalance: new BigNumber(1_000),
      subAccounts: [
        {
          type: "TokenAccount",
          token,
          balance: new BigNumber(5),
          spendableBalance: new BigNumber(5),
          pendingOperations: [],
        },
      ] as never,
    });
    const api = writeIntentApi({ getAssetFromToken }, coinModule as never, account, {});
    expect(api).not.toBe(coinModule);
    expect(api.craftTransactionData(context, intent())).toBeUndefined();

    await api.validateIntent(context, intent(), [], undefined);
    expect(coinModule.validateIntent).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      extractBalances(account, getAssetFromToken),
      {},
    );
    expect((coinModule.validateIntent.mock.calls[0] as unknown[])[2]).toContainEqual({
      value: 5n,
      locked: 0n,
      asset: tokenAsset,
    });
  });
});

describe("portfolioBroadcast", () => {
  it("broadcasts through the client's coin module in local mode", async () => {
    configure("local", "");
    await expect(
      portfolioBroadcast(undefined, coinModule as never, rippleAccount(), "signed"),
    ).resolves.toBe("broadcast-hash");
    expect(coinModule.broadcast).toHaveBeenCalledWith(expect.anything(), "signed", undefined);
  });

  it("fails with UNAVAILABLE in remote mode without a service url", async () => {
    configure("remote", "");
    await expect(
      portfolioBroadcast(undefined, coinModule as never, rippleAccount(), "signed"),
    ).rejects.toMatchObject({ type: "UNAVAILABLE" });
  });
});
