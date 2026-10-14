import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { parseAmount, toAccountIntent, toCoinIntent } from "./intent";

describe("parseAmount", () => {
  it("parses a decimal string of base units", () => {
    expect(parseAmount("123456789012345678901", "amount")).toBe(123456789012345678901n);
  });

  it("rejects anything else as a bad request", () => {
    expect(() => parseAmount("1.5", "amount")).toThrow(
      new PortfolioApiError("BAD_REQUEST", "Invalid amount 1.5"),
    );
  });
});

describe("toCoinIntent", () => {
  it("maps every field of the service intent", () => {
    expect(
      toCoinIntent({
        type: "send",
        sender: "0xsender",
        senderPublicKey: "pubkey",
        recipient: "0xrecipient",
        amount: "1000",
        asset: "0xusdc",
        feesStrategy: "fast",
      }),
    ).toEqual({
      intentType: "transaction",
      type: "send",
      sender: "0xsender",
      senderPublicKey: "pubkey",
      recipient: "0xrecipient",
      amount: 1000n,
      asset: { type: "token", assetReference: "0xusdc" },
      feesStrategy: "fast",
    });
  });

  it("defaults to a native transfer of nothing to no one", () => {
    expect(toCoinIntent({ type: "send", sender: "0xsender" })).toEqual({
      intentType: "transaction",
      type: "send",
      sender: "0xsender",
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
    });
    expect(toCoinIntent({ type: "send", sender: "0xsender", asset: "native" }).asset).toEqual({
      type: "native",
    });
  });

  it("spreads the network params into the intent, the common fields taking precedence", () => {
    const intent = toCoinIntent({
      type: "send",
      sender: "0xsender",
      amount: "5",
      networkParams: { useAllAmount: true, memo: { type: "string", value: "hi" }, amount: "9" },
    });

    expect(intent).toEqual(
      expect.objectContaining({
        useAllAmount: true,
        memo: { type: "string", value: "hi" },
        amount: 5n,
      }),
    );
  });

  it("ignores network params that are not an object", () => {
    const base = toCoinIntent({ type: "send", sender: "0xsender" });

    for (const networkParams of [null, ["a"], "text"]) {
      expect(toCoinIntent({ type: "send", sender: "0xsender", networkParams })).toEqual(base);
    }
  });
});

describe("toAccountIntent", () => {
  it("leaves the sender to the account module", () => {
    expect(toAccountIntent({ type: "send", sender: "xpub", recipient: "bc1" })).toEqual({
      intentType: "transaction",
      type: "send",
      recipient: "bc1",
      amount: 0n,
      asset: { type: "native" },
    });
  });
});
