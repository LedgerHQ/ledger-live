import { convertAction, type ActionWithNonce } from "./types";

const cases: Array<[string, ActionWithNonce, object]> = [
  [
    "order",
    {
      nonce: 42,
      action: {
        type: "order",
        orders: [{ a: 1, b: true, p: "100.0", s: "1.0", r: false, t: { limit: { tif: "Gtc" } } }],
        grouping: "na",
      },
    },
    {
      type: "order",
      orders: [{ a: 1, b: true, p: "100.0", s: "1.0", r: false, t: { limit: { tif: "Gtc" } } }],
      grouping: "na",
      nonce: 42,
    },
  ],
  [
    "cancel",
    {
      nonce: 7,
      action: { type: "cancel", cancels: [{ a: 3, o: 99 }] },
    },
    { type: "cancel", cancels: [{ a: 3, o: 99 }], nonce: 7 },
  ],
  [
    "updateLeverage",
    {
      nonce: 1,
      action: { type: "updateLeverage", asset: 2, isCross: true, leverage: 10 },
    },
    { type: "updateLeverage", asset: 2, isCross: true, leverage: 10, nonce: 1 },
  ],
  [
    "order with multiple orders",
    {
      nonce: 10,
      action: {
        type: "order",
        orders: [
          { a: 1, b: true, p: "100.0", s: "1.0", r: false, t: { limit: { tif: "Gtc" } } },
          {
            a: 2,
            b: false,
            p: "200.0",
            s: "0.5",
            r: true,
            t: { trigger: { isMarket: true, triggerPx: "195.0", tpsl: "sl" } },
          },
          { a: 3, b: true, p: "50.0", s: "2.0", r: false, t: { limit: { tif: "Ioc" } } },
        ],
        grouping: "normalTpsl",
      },
    },
    {
      type: "order",
      orders: [
        { a: 1, b: true, p: "100.0", s: "1.0", r: false, t: { limit: { tif: "Gtc" } } },
        {
          a: 2,
          b: false,
          p: "200.0",
          s: "0.5",
          r: true,
          t: { trigger: { isMarket: true, triggerPx: "195.0", tpsl: "sl" } },
        },
        { a: 3, b: true, p: "50.0", s: "2.0", r: false, t: { limit: { tif: "Ioc" } } },
      ],
      grouping: "normalTpsl",
      nonce: 10,
    },
  ],
  [
    "batchModify",
    {
      nonce: 15,
      action: {
        type: "batchModify",
        modifies: [
          {
            oid: 1,
            order: { a: 1, b: true, p: "110.0", s: "1.0", r: false, t: { limit: { tif: "Gtc" } } },
          },
          {
            oid: 2,
            order: { a: 2, b: false, p: "220.0", s: "0.5", r: true, t: { limit: { tif: "Alo" } } },
          },
        ],
      },
    },
    {
      type: "batchModify",
      modifies: [
        {
          oid: 1,
          order: { a: 1, b: true, p: "110.0", s: "1.0", r: false, t: { limit: { tif: "Gtc" } } },
        },
        {
          oid: 2,
          order: { a: 2, b: false, p: "220.0", s: "0.5", r: true, t: { limit: { tif: "Alo" } } },
        },
      ],
      nonce: 15,
    },
  ],
  [
    "approveBuilderFee",
    {
      nonce: 99,
      action: {
        type: "approveBuilderFee",
        hyperliquidChain: "Mainnet",
        signatureChainId: "0xa4b1",
        maxFeeRate: "0.001%",
        builder: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      },
    },
    {
      type: "approveBuilderFee",
      hyperliquidChain: "Mainnet",
      signatureChainId: "0xa4b1",
      maxFeeRate: "0.001%",
      builder: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      nonce: 99,
    },
  ],
];

describe("convertAction", () => {
  it.each(cases)("spreads a '%s' action with nonce", (_type, input, expected) => {
    expect(convertAction(input)).toEqual(expected);
  });
});
