import BigNumber from "bignumber.js";
import { adaptA4OperationToLiveOperation, fetchA4Operations, parseA4Asset } from "./operations";
import type { A4Client } from "./index";
import type { A4OperationView } from "./types";

describe("parseA4Asset", () => {
  it("returns native for 'native'", () => {
    expect(parseA4Asset("native", "0xowner")).toEqual({ type: "native" });
  });

  it("returns type only for an unknown single-segment path", () => {
    expect(parseA4Asset("foo", "0xowner")).toEqual({ type: "foo" });
  });

  it("parses EVM ERC20 2-segment path", () => {
    expect(parseA4Asset("erc20.0xcontract", "0xowner")).toEqual({
      type: "erc20",
      assetReference: "0xcontract",
      assetOwner: "0xowner",
    });
  });

  it("parses Tron TRC20 3-segment token-standard path", () => {
    expect(parseA4Asset("token.trc20.Tcontract", "Towner")).toEqual({
      type: "trc20",
      assetReference: "Tcontract",
      assetOwner: "Towner",
    });
  });

  it("parses Tron TRC10 3-segment token-standard path", () => {
    expect(parseA4Asset("token.trc10.1002000", "Towner")).toEqual({
      type: "trc10",
      assetReference: "1002000",
      assetOwner: "Towner",
    });
  });

  it("parses Stellar 2-segment token path (issuer not in path)", () => {
    expect(parseA4Asset("token.USDC", "Gowner")).toEqual({
      type: "token",
      assetReference: "USDC",
      assetOwner: "Gowner",
    });
  });
});

describe("adaptA4OperationToLiveOperation", () => {
  it("returns [] for NFT_IN", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { ledgerOpType: "NFT_IN" } },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    expect(adaptA4OperationToLiveOperation("accountId", "0xaddress", op)).toEqual([]);
  });

  it("returns [] for NFT_OUT", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { ledgerOpType: "NFT_OUT" } },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    expect(adaptA4OperationToLiveOperation("accountId", "0xaddress", op)).toEqual([]);
  });

  it("produces OUT with value = |delta| for native debit (no parts)", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("produces IN with value = delta for native credit (no parts)", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "979000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xsender"],
      recipients: ["0xaddress"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-IN",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "IN",
      value: new BigNumber(979000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xsender"],
      recipients: ["0xaddress"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "IN" },
    });
  });

  it("sets value = fee and hasFailed = true for failed tx", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-1021000" },
      events: {},
      failed: true,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(21000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: true,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("returns [] for failed incoming op", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "500" },
      events: {},
      failed: true,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    expect(adaptA4OperationToLiveOperation("accountId", "0xaddress", op)).toEqual([]);
  });

  it("passes through known ledgerOpType regardless of delta sign", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { ledgerOpType: "DELEGATE" } },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-DELEGATE",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "DELEGATE",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "DELEGATE" },
    });
  });

  it("falls back to NONE for unknown ledgerOpType, preserves raw type in extra", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { ledgerOpType: "CLAIM_REWARD" } },
      assets: { native: "0" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-NONE",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "NONE",
      value: new BigNumber(0),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "CLAIM_REWARD" },
    });
  });

  it("ignores memo in tx.details", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { memo: "hello" } },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("ignores internal flag in tx.details", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { internal: true } },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("sets extra.feePayer from a4Op.feePayer", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      feePayer: "0xpayer",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { feePayer: "0xpayer", ledgerOpType: "OUT" },
    });
  });

  it("produces FEES using non-native asset as recipient when native delta equals fee", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000", "erc20.0xcontract": "-500" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const result = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "accountId-0xtxhash-FEES",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "FEES",
      value: new BigNumber(21000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xcontract"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "FEES" },
    });
  });

  it("produces only OUT from transfer part; skips fee part", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      parts: [
        { type: "transfer", address: "0xaddress", asset: "native", amount: "-1000000" },
        { type: "fee", address: "0xaddress", asset: "native", amount: "-21000" },
      ],
    };
    const result = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual([
      {
        id: "accountId-0xtxhash-OUT",
        hash: "0xtxhash",
        accountId: "accountId",
        type: "OUT",
        value: new BigNumber(1021000),
        fee: new BigNumber(21000),
        blockHash: "0xblockhash",
        blockHeight: 1000,
        senders: ["0xaddress"],
        recipients: ["0xrecipient"],
        date: new Date("2024-01-01T00:00:00Z"),
        transactionSequenceNumber: undefined,
        hasFailed: false,
        extra: { ledgerOpType: "OUT" },
      },
    ]);
  });

  it("uses peer from transfer part for recipients on OUT op", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      parts: [
        {
          type: "transfer",
          address: "0xaddress",
          peer: "0xpeer",
          asset: "native",
          amount: "-1000000",
        },
      ],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result.senders).toEqual(["0xaddress"]);
    expect(result.recipients).toEqual(["0xpeer"]);
  });

  it("uses peer from transfer part for senders on IN op", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xtx-sender"],
      recipients: ["0xaddress"],
      parts: [
        {
          type: "transfer",
          address: "0xaddress",
          peer: "0xpeer",
          asset: "native",
          amount: "1000000",
        },
      ],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result.senders).toEqual(["0xpeer"]);
    expect(result.recipients).toEqual(["0xaddress"]);
  });

  it("skips parts belonging to a different address", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xother"],
      recipients: ["0xaddress"],
      parts: [
        { type: "transfer", address: "0xother", asset: "native", amount: "-1000000" },
        { type: "transfer", address: "0xaddress", asset: "native", amount: "1000000" },
      ],
    };
    expect(adaptA4OperationToLiveOperation("accountId", "0xaddress", op)).toEqual([
      {
        id: "accountId-0xtxhash-IN",
        hash: "0xtxhash",
        accountId: "accountId",
        type: "IN",
        value: new BigNumber(1000000),
        fee: new BigNumber(21000),
        blockHash: "0xblockhash",
        blockHeight: 1000,
        senders: ["0xother"],
        recipients: ["0xaddress"],
        date: new Date("2024-01-01T00:00:00Z"),
        transactionSequenceNumber: undefined,
        hasFailed: false,
        extra: { ledgerOpType: "IN" },
      },
    ]);
  });

  it("skips event parts", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      parts: [
        { type: "event", address: "0xaddress", eventPath: "Transfer", eventData: {} },
        { type: "transfer", address: "0xaddress", asset: "native", amount: "-1000000" },
      ],
    };
    expect(adaptA4OperationToLiveOperation("accountId", "0xaddress", op)).toEqual([
      {
        id: "accountId-0xtxhash-OUT",
        hash: "0xtxhash",
        accountId: "accountId",
        type: "OUT",
        value: new BigNumber(1021000),
        fee: new BigNumber(21000),
        blockHash: "0xblockhash",
        blockHeight: 1000,
        senders: ["0xaddress"],
        recipients: ["0xrecipient"],
        date: new Date("2024-01-01T00:00:00Z"),
        transactionSequenceNumber: undefined,
        hasFailed: false,
        extra: { ledgerOpType: "OUT" },
      },
    ]);
  });

  it("uses feePayer as sender for NONE op when feePayer differs from account", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "0" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      feePayer: "0xinitiator",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result.type).toEqual("NONE");
    expect(result.senders).toEqual(["0xinitiator"]);
    expect(result.recipients).toEqual(["0xrecipient"]);
  });

  it("defaults senders to [account] for OUT when tx-level senders is absent", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-1000" },
      events: {},
      failed: false,
      fees: "0",
      feeAsset: "native",
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1000),
      fee: new BigNumber(0),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xaddress"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("ignores stake in tx.details", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { stake: { address: "0xstaker", amount: 1000000 } } },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("ignores familyExtra in tx.details", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { familyExtra: { pagingToken: "cursor123" } } },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("produces NONE for parent account when only non-native assets exist", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: {
        hash: "0xtxhash",
        details: {
          assetAmount: "500",
          assetSenders: ["0xsender1"],
          assetRecipients: ["0xrecip1"],
        },
      },
      assets: { "erc20.0xcontract": "-500" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-NONE",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "NONE",
      value: new BigNumber(0),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xcontract"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "NONE" },
    });
  });

  it("produces FEES op when native-only assets delta equals fee", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-FEES",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "FEES",
      value: new BigNumber(21000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "FEES" },
    });
  });

  it("produces FEES op with ERC20 contract as recipient when parts have non-native transfer", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: [],
      parts: [
        {
          type: "transfer",
          address: "0xother",
          asset: "erc20.0xcontract",
          amount: "1000",
          peer: "0xaddress",
        },
        { type: "transfer", address: "0xaddress", asset: "erc20.0xcontract", amount: "1000" },
      ],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-FEES",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "FEES",
      value: new BigNumber(21000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xcontract"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "FEES" },
    });
  });

  it("produces FEES op with ERC20 token as recipient when first event is router and second has ERC20 selector", () => {
    const erc20Payload =
      "0xa9059cbb" +
      "0".repeat(24) +
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
      "0".repeat(63) +
      "1";
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: [],
      parts: [
        {
          type: "event",
          address: "0xrouter",
          eventPath: "Swap",
          eventData: { contractAddress: "0xrouter", contractPayload: "0xdeadbeef" },
        },
        {
          type: "event",
          address: "0xtoken",
          eventPath: "Transfer",
          eventData: { contractAddress: "0xtoken", contractPayload: erc20Payload },
        },
      ],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result.type).toEqual("FEES");
    expect(result.recipients).toEqual(["0xtoken"]);
  });

  it("produces FEES with outgoing non-native transfer part as recipient when swap has incoming and outgoing parts", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: [],
      parts: [
        {
          type: "transfer",
          address: "0xaddress",
          asset: "erc20.0xreceived",
          amount: "1000",
          peer: "0xrouter",
        },
        {
          type: "transfer",
          address: "0xaddress",
          asset: "erc20.0xsent",
          amount: "-500",
          peer: "0xrouter",
        },
        { type: "fee", address: "0xaddress", asset: "native", amount: "-21000" },
      ],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result.type).toEqual("FEES");
    expect(result.recipients).toEqual(["0xsent"]);
  });

  it("produces FEES with outgoing non-native asset as recipient when assets has two tokens", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000", "erc20.0xreceived": "1000", "erc20.0xsent": "-500" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: [],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result.type).toEqual("FEES");
    expect(result.recipients).toEqual(["0xsent"]);
  });

  it("ignores parentSenders/parentRecipients from tx.details", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: {
        hash: "0xtxhash",
        details: {
          parentSenders: ["0xparent-sender"],
          parentRecipients: ["0xparent-recipient"],
        },
      },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(1021000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("sets value = fee for failed outgoing tx in parts path", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: true,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      parts: [{ type: "transfer", address: "0xaddress", asset: "native", amount: "-1000000" }],
    };
    const [result] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(result).toEqual({
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(21000),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: true,
      extra: { ledgerOpType: "OUT" },
    });
  });

  it("skips failed incoming op in parts path", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: true,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      parts: [{ type: "transfer", address: "0xaddress", asset: "native", amount: "1000000" }],
    };
    expect(adaptA4OperationToLiveOperation("accountId", "0xaddress", op)).toEqual([]);
  });

  it("matches part with checksummed address to lowercase account address", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: {},
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0x742d35cc6634c0532925a3b844bc454e4438f44e"],
      recipients: ["0xrecipient"],
      parts: [
        {
          type: "transfer",
          address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          asset: "native",
          amount: "-1021000",
        },
      ],
    };
    const ops = adaptA4OperationToLiveOperation(
      "accountId",
      "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      op,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("OUT");
  });

  it("parent OUT and token OUT in same tx have distinct ids", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      parts: [
        {
          type: "event",
          address: "0xaddress",
          eventPath: "erc20.Transfer",
          eventData: {
            contractAddress: "0xcontract",
            from: "0xaddress",
            to: "0xother",
            value: "500",
          },
        },
      ],
    };
    const ops = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    const ids = ops.map(o => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("operation ID format non-regression", () => {
  const base = {
    block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
    events: {},
    failed: false,
    feeAsset: "native",
    feePayer: "0xaddress",
    senders: ["0xaddress"],
    recipients: ["0xrecipient"],
  } satisfies Partial<A4OperationView>;

  it("native debit only → OUT", () => {
    const op: A4OperationView = {
      ...base,
      tx: { hash: "0xhash" },
      fees: "21000",
      assets: { native: "-1021000" },
    };
    expect(adaptA4OperationToLiveOperation("acc", "0xaddress", op)[0].id).toBe("acc-0xhash-OUT");
  });

  it("native credit only → IN", () => {
    const op: A4OperationView = {
      ...base,
      tx: { hash: "0xhash" },
      fees: "21000",
      assets: { native: "100000" },
    };
    expect(adaptA4OperationToLiveOperation("acc", "0xaddress", op)[0].id).toBe("acc-0xhash-IN");
  });

  it("native-only delta equals fee → FEES (not OUT)", () => {
    const op: A4OperationView = {
      ...base,
      tx: { hash: "0xhash" },
      fees: "21000",
      assets: { native: "-21000" },
    };
    expect(adaptA4OperationToLiveOperation("acc", "0xaddress", op)[0].id).toBe("acc-0xhash-FEES");
  });

  it("erc20 + native-delta-equals-fee → FEES (not OUT)", () => {
    const op: A4OperationView = {
      ...base,
      tx: { hash: "0xhash" },
      fees: "21000",
      assets: { native: "-21000", "erc20.0xcontract": "-500" },
    };
    expect(adaptA4OperationToLiveOperation("acc", "0xaddress", op)[0].id).toBe("acc-0xhash-FEES");
  });

  it("erc20 + native-delta-exceeds-fee → OUT (native covers more than just fee)", () => {
    const op: A4OperationView = {
      ...base,
      tx: { hash: "0xhash" },
      fees: "21000",
      assets: { native: "-1021000", "erc20.0xcontract": "-500" },
    };
    expect(adaptA4OperationToLiveOperation("acc", "0xaddress", op)[0].id).toBe("acc-0xhash-OUT");
  });

  it("non-native only → NONE", () => {
    const op: A4OperationView = {
      ...base,
      tx: { hash: "0xhash" },
      fees: "21000",
      assets: { "erc20.0xcontract": "-500" },
    };
    expect(adaptA4OperationToLiveOperation("acc", "0xaddress", op)[0].id).toBe("acc-0xhash-NONE");
  });
});

describe("fetchA4Operations", () => {
  function makeClient(items: A4OperationView[]): A4Client {
    return {
      listOperations: jest.fn().mockResolvedValue({
        data: { items, nextToken: undefined },
        version: undefined,
      }),
    } as unknown as A4Client;
  }

  it("uses liveAccountId for operation ids and accountId fields, not a4AccountId", async () => {
    const a4Op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-1021000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
    };
    const result = await fetchA4Operations(
      makeClient([a4Op]),
      "a4-account-id",
      "live-account-id",
      "0xaddress",
      0,
    );
    expect(result.length).toBeGreaterThan(0);
    for (const op of result) {
      expect(op.accountId).toBe("live-account-id");
      expect(op.id).toMatch(/^live-account-id-/);
      expect(op.id).not.toMatch(/^a4-account-id-/);
    }
  });

  it("emits token ops from ERC20 Transfer event parts alongside the parent op", async () => {
    const a4Op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: ["0xcontract"],
      parts: [
        {
          type: "event",
          address: "0xaddress",
          eventPath: "erc20.Transfer",
          eventData: {
            contractAddress: "0xcontract",
            from: "0xaddress",
            to: "0xaddress",
            value: "5000",
          },
        },
      ],
    };
    const result = await fetchA4Operations(
      makeClient([a4Op]),
      "a4AccountId",
      "accountId",
      "0xaddress",
      0,
    );
    const tokenOps = result.filter(
      op => op.extra !== null && typeof op.extra === "object" && "assetReference" in op.extra,
    );
    expect(tokenOps).toHaveLength(2);
    expect(tokenOps[0]).toMatchObject({
      hash: "0xtxhash",
      accountId: "accountId",
      type: "IN",
      value: new BigNumber(5000),
      extra: {
        assetReference: "0xcontract",
        assetOwner: "0xaddress",
        assetAmount: "5000",
        ledgerOpType: "IN",
      },
    });
    expect(tokenOps[1]).toMatchObject({
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(5000),
      extra: {
        assetReference: "0xcontract",
        assetOwner: "0xaddress",
        assetAmount: "5000",
        ledgerOpType: "OUT",
      },
    });
  });

  it("decodes ERC20 transfer from contractPayload when decoded fields absent", async () => {
    const a4Op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: [],
      parts: [
        {
          type: "event",
          address: "0xaddress",
          eventPath: "erc20.Transfer",
          eventData: {
            contractAddress: "0xcontract",
            contractPayload:
              "0xa9059cbb" +
              "000000000000000000000000b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0" +
              "0000000000000000000000000000000000000000000000000000000000002710",
          },
        },
      ],
    };
    const result = await fetchA4Operations(
      makeClient([a4Op]),
      "a4AccountId",
      "accountId",
      "0xaddress",
      0,
    );
    const tokenOps = result.filter(
      op => op.extra !== null && typeof op.extra === "object" && "assetReference" in op.extra,
    );
    expect(tokenOps).toHaveLength(1);
    expect(tokenOps[0]).toMatchObject({
      type: "OUT",
      value: new BigNumber(10000),
      extra: { assetReference: "0xcontract", assetAmount: "10000", ledgerOpType: "OUT" },
    });
  });

  it("emits no token ops when event parts lack ERC20 Transfer fields", async () => {
    const a4Op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash" },
      assets: { native: "-21000" },
      events: {},
      failed: false,
      fees: "21000",
      feeAsset: "native",
      senders: ["0xaddress"],
      recipients: [],
      parts: [
        {
          type: "event",
          address: "0xaddress",
          eventPath: "other",
          eventData: { contractAddress: "0xcontract" },
        },
      ],
    };
    const result = await fetchA4Operations(
      makeClient([a4Op]),
      "a4AccountId",
      "accountId",
      "0xaddress",
      0,
    );
    expect(
      result.filter(
        op => op.extra !== null && typeof op.extra === "object" && "assetReference" in op.extra,
      ),
    ).toHaveLength(0);
  });
});
