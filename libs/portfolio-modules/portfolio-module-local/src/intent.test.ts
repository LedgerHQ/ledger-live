import {
  PortfolioApiError,
  type TransactionIntentView,
} from "@ledgerhq/portfolio-module-framework";
import {
  feeParametersOf,
  intentAssetOf,
  intentTypeOf,
  parseAmount,
  toAccountIntent,
  toCoinIntent,
} from "./intent";
import { aLocalNetwork, type FakeNetwork } from "./test-utils";

const usdc = {
  type: "erc20",
  assetReference: "0xusdc",
  name: "USD Coin",
  unit: { name: "USDC", code: "USDC", magnitude: 6 },
};
const send = (fields: Partial<TransactionIntentView> = {}): TransactionIntentView => ({
  type: "send",
  sender: "0xsender",
  ...fields,
});
const badRequest = (message: string) => new PortfolioApiError("BAD_REQUEST", message);

const aNetwork = (): FakeNetwork => {
  const network = aLocalNetwork({ currencyId: "ethereum" });
  network.coinModule.craftTransactionData.mockReturnValue("0xcalldata");
  return network;
};

describe("parseAmount", () => {
  it("parses a decimal string of base units", () => {
    expect(parseAmount("123456789012345678901", "amount")).toBe(123456789012345678901n);
  });

  it("rejects anything else as a bad request", () => {
    expect(() => parseAmount("1.5", "amount")).toThrow(badRequest("Invalid amount 1.5"));
  });
});

describe("intentTypeOf", () => {
  it("is a transaction when absent", () => {
    expect(intentTypeOf(send())).toBe("transaction");
  });

  it("is the intent type sent", () => {
    expect(intentTypeOf(send({ intentType: "staking" }))).toBe("staking");
    expect(intentTypeOf(send({ intentType: "transaction" }))).toBe("transaction");
  });

  it("rejects any other value as a bad request", () => {
    expect(() => intentTypeOf(send({ intentType: "swap" as never }))).toThrow(
      badRequest("Invalid intentType swap"),
    );
  });
});

describe("intentAssetOf", () => {
  it("is the asset info sent, when its key is the asset", () => {
    expect(intentAssetOf(send({ asset: "0xusdc", assetInfo: usdc }), [])).toBe(usdc);
    const native = { type: "native", name: "Ether" };
    expect(intentAssetOf(send({ asset: "native", assetInfo: native }), [])).toBe(native);
    expect(intentAssetOf(send({ assetInfo: native }), [])).toBe(native);
  });

  it("rejects an asset info keyed otherwise than the asset", () => {
    expect(() => intentAssetOf(send({ asset: "0xother", assetInfo: usdc }), [])).toThrow(
      badRequest("assetInfo is keyed 0xusdc, not 0xother"),
    );
    expect(() => intentAssetOf(send({ assetInfo: usdc }), [])).toThrow(
      badRequest("assetInfo is keyed 0xusdc, not native"),
    );
  });

  it("is the native asset for native or no asset", () => {
    expect(intentAssetOf(send(), [])).toEqual({ type: "native" });
    expect(intentAssetOf(send({ asset: "native" }), [])).toEqual({ type: "native" });
  });

  it("is the one sender balance keyed as the asset, without asset info", () => {
    const balances = [
      { asset: { type: "native" }, value: 1n },
      { asset: usdc, value: 5n },
    ];

    expect(intentAssetOf(send({ asset: "0xusdc" }), balances)).toBe(usdc);
  });

  it("rejects an asset the sender holds no balance, or several balances, of", () => {
    const twice = [
      { asset: usdc, value: 5n },
      { asset: { ...usdc, assetOwner: "issuer" }, value: 1n },
    ];

    expect(() => intentAssetOf(send({ asset: "0xusdc" }), [])).toThrow(
      badRequest("Asset 0xusdc needs an assetInfo: the sender holds 0 balances of it"),
    );
    expect(() => intentAssetOf(send({ asset: "0xusdc" }), twice)).toThrow(
      badRequest("Asset 0xusdc needs an assetInfo: the sender holds 2 balances of it"),
    );
  });
});

describe("toCoinIntent", () => {
  it("maps every field of the service intent", () => {
    expect(
      toCoinIntent(
        send({
          senderPublicKey: "pubkey",
          recipient: "0xrecipient",
          amount: "1000",
          asset: "0xusdc",
          assetInfo: usdc,
          intentType: "staking",
          feesStrategy: "fast",
        }),
        aNetwork(),
      ),
    ).toEqual({
      intentType: "staking",
      type: "send",
      sender: "0xsender",
      senderPublicKey: "pubkey",
      recipient: "0xrecipient",
      amount: 1000n,
      asset: usdc,
      feesStrategy: "fast",
    });
  });

  it("defaults to a native transfer of nothing to no one", () => {
    expect(toCoinIntent(send(), aNetwork())).toEqual({
      intentType: "transaction",
      type: "send",
      sender: "0xsender",
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
    });
  });

  it("finds the asset among the sender balances", () => {
    expect(
      toCoinIntent(send({ asset: "0xusdc" }), aNetwork(), [{ asset: usdc, value: 1n }]),
    ).toEqual(expect.objectContaining({ asset: usdc }));
  });

  it("spreads the network params as sent, the common fields taking precedence", () => {
    const memos = new Map([["type", "text"]]);
    const data = Buffer.from("instructions");
    const intent = toCoinIntent(
      send({
        amount: "5",
        networkParams: {
          useAllAmount: true,
          memo: memos,
          data,
          sequence: 7n,
          mode: "delegate",
          valAddress: "validator",
          amount: "9",
        },
      }),
      aNetwork(),
    );

    expect(intent).toEqual(
      expect.objectContaining({
        useAllAmount: true,
        memo: memos,
        data,
        sequence: 7n,
        mode: "delegate",
        valAddress: "validator",
        amount: 5n,
      }),
    );
  });

  it("leaves the fee parameters out of the intent", () => {
    const intent = toCoinIntent(
      send({ networkParams: { memo: "hi", feeParameters: { gasLimit: 21000n } } }),
      aNetwork(),
    );

    expect(intent).not.toHaveProperty("feeParameters");
    expect(intent).toHaveProperty("memo", "hi");
  });

  it("ignores network params that are not an object", () => {
    const network = aNetwork();
    const base = toCoinIntent(send(), network);

    for (const networkParams of [null, ["a"], "text"]) {
      expect(toCoinIntent(send({ networkParams }), network)).toEqual(base);
    }
  });

  it("completes undefined data with the coin module, when asked", () => {
    const network = aNetwork();

    const completed = toCoinIntent(send({ amount: "5" }), network, [], { completeData: true });
    const keyed = toCoinIntent(send({ networkParams: { data: undefined } }), network, [], {
      completeData: true,
    });

    expect(completed).toEqual(expect.objectContaining({ data: "0xcalldata" }));
    expect(keyed).toEqual(expect.objectContaining({ data: "0xcalldata" }));
    const { data: _data, ...withoutData } = completed as { data?: unknown };
    expect(network.coinModule.craftTransactionData).toHaveBeenCalledWith(
      network.context,
      withoutData,
    );
  });

  it("keeps the data sent, and leaves it undefined unless asked", () => {
    const network = aNetwork();

    expect(
      toCoinIntent(send({ networkParams: { data: "0xsent" } }), network, [], {
        completeData: true,
      }),
    ).toEqual(expect.objectContaining({ data: "0xsent" }));
    expect(toCoinIntent(send(), network)).not.toHaveProperty("data");
    expect(network.coinModule.craftTransactionData).not.toHaveBeenCalled();
  });

  it("lets a failure to complete the data propagate", () => {
    const network = aNetwork();
    network.coinModule.craftTransactionData.mockImplementation(() => {
      throw new Error("no calldata");
    });

    expect(() => toCoinIntent(send(), network, [], { completeData: true })).toThrow("no calldata");
  });
});

describe("toAccountIntent", () => {
  it("leaves the sender and the data to the account module", () => {
    const network = aNetwork();

    expect(
      toAccountIntent(send({ sender: "xpub", recipient: "bc1", asset: "0xusdc" }), network, [
        { asset: usdc, value: 1n },
      ]),
    ).toEqual({
      intentType: "transaction",
      type: "send",
      recipient: "bc1",
      amount: 0n,
      asset: usdc,
    });
    expect(network.coinModule.craftTransactionData).not.toHaveBeenCalled();
  });
});

describe("feeParametersOf", () => {
  it("is the fees strategy of the intent, under the fee parameters it carries", () => {
    expect(
      feeParametersOf(
        send({
          feesStrategy: "fast",
          networkParams: { feeParameters: { feesStrategy: "custom", maxFeePerGas: 7n } },
        }),
      ),
    ).toEqual({ feesStrategy: "custom", maxFeePerGas: 7n });
  });

  it("is the fees strategy alone without an object of fee parameters", () => {
    expect(feeParametersOf(send({ feesStrategy: "slow" }))).toEqual({ feesStrategy: "slow" });
    expect(
      feeParametersOf(send({ feesStrategy: "slow", networkParams: { feeParameters: "x" } })),
    ).toEqual({ feesStrategy: "slow" });
  });

  it("is an empty object of fee parameters as sent", () => {
    expect(feeParametersOf(send({ networkParams: { feeParameters: {} } }))).toEqual({});
  });

  it("is none without a fees strategy nor an object of fee parameters", () => {
    expect(feeParametersOf(send())).toBeUndefined();
    expect(feeParametersOf(send({ networkParams: { feeParameters: "x" } }))).toBeUndefined();
  });
});
