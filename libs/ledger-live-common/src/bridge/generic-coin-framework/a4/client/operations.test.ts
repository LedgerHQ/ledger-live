import BigNumber from "bignumber.js";
import { adaptA4OperationToLiveOperation, parseA4Asset } from "./operations";
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
      extra: {},
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
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
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
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: {},
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
      extra: {},
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

  it("falls back to NONE for unknown ledgerOpType", () => {
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

  it("sets extra.memo from tx.details", () => {
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
      extra: { memo: "hello" },
    });
  });

  it("sets extra.internal from tx.details", () => {
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
      extra: { internal: true },
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
      extra: { feePayer: "0xpayer" },
    });
  });

  it("sets assetReference and assetOwner for token assets", () => {
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
    const [nativeOp, tokenOp] = adaptA4OperationToLiveOperation("accountId", "0xaddress", op);
    expect(nativeOp).toEqual({
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
      hasFailed: false,
      extra: {},
    });
    expect(tokenOp).toEqual({
      id: "accountId-0xtxhash-OUT-i1",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(500),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { assetReference: "0xcontract", assetOwner: "0xaddress" },
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
        extra: {},
      },
    ]);
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
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
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
        senders: ["0xaddress"],
        recipients: ["0xrecipient"],
        date: new Date("2024-01-01T00:00:00Z"),
        transactionSequenceNumber: undefined,
        hasFailed: false,
        extra: {},
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
        extra: {},
      },
    ]);
  });

  it("defaults senders and recipients to [] when absent", () => {
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
      senders: [],
      recipients: [],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: {},
    });
  });

  it("sets extra.stake from tx.details.stake", () => {
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
      extra: { stake: { address: "0xstaker", amount: new BigNumber(1000000) } },
    });
  });

  it("falls back to BigNumber(0) for stake with non-numeric amount", () => {
    const op: A4OperationView = {
      block: { hash: "0xblockhash", height: 1000, time: "2024-01-01T00:00:00Z" },
      tx: { hash: "0xtxhash", details: { stake: { address: "0xstaker", amount: "not-a-number" } } },
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
      extra: { stake: { address: "0xstaker", amount: new BigNumber(0) } },
    });
  });

  it("sets extra.familyExtra from tx.details.familyExtra", () => {
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
      extra: { familyExtra: { pagingToken: "cursor123" } },
    });
  });

  it("sets extra.assetAmount, assetSenders, assetRecipients from tx.details", () => {
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
      id: "accountId-0xtxhash-OUT",
      hash: "0xtxhash",
      accountId: "accountId",
      type: "OUT",
      value: new BigNumber(500),
      fee: new BigNumber(21000),
      blockHash: "0xblockhash",
      blockHeight: 1000,
      senders: ["0xaddress"],
      recipients: ["0xrecipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: {
        assetAmount: "500",
        assetSenders: ["0xsender1"],
        assetRecipients: ["0xrecip1"],
        assetReference: "0xcontract",
        assetOwner: "0xaddress",
      },
    });
  });

  it("uses parentSenders/parentRecipients from tx.details for op senders and extra", () => {
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
      senders: ["0xparent-sender"],
      recipients: ["0xparent-recipient"],
      date: new Date("2024-01-01T00:00:00Z"),
      transactionSequenceNumber: undefined,
      hasFailed: false,
      extra: { parentSenders: ["0xparent-sender"], parentRecipients: ["0xparent-recipient"] },
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
      extra: {},
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
});
