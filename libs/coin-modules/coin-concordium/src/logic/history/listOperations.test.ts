import { VALID_ADDRESS, VALID_ADDRESS_2, createFixtureContext } from "../../test/fixtures";
import type { WalletProxyTransaction } from "../../types";
import { listOperations, parseTransaction } from "./listOperations";

const context = createFixtureContext();
const SPONSOR = "2zJ1DNrhhdrcNN4XAGaWq3Ziw2pKvKgUC1Ua67aZVGg4A111PX";

// Aliases 1 and 2 of VALID_ADDRESS: the same account, as the chain reports it.
const VALID_ADDRESS_ALIAS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qjcEerDDouG";
const VALID_ADDRESS_ALIAS_2 = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qjcEez6ovLW";

jest.mock("@ledgerhq/concordium-core", () => ({
  ...jest.requireActual("@ledgerhq/concordium-core"),
  decodeMemoFromCbor: jest.fn(),
}));

jest.mock("../../network/proxyClient", () => ({
  getTransactions: jest.fn(),
}));

const { getTransactions: getTransactionsMock } = jest.requireMock("../../network/proxyClient");

describe("parseTransaction", () => {
  const baseTx: Omit<WalletProxyTransaction, "details"> = {
    id: 42,
    blockTime: 1700000000,
    blockHash: "aabb",
    blockHeight: 1000,
    transactionHash: "cc".repeat(32),
    cost: 500,
    origin: { type: "self" },
    total: -1000500,
  };

  it("should parse an outgoing transfer", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
      },
    };

    const result = parseTransaction(context, tx, VALID_ADDRESS);

    expect(result).toMatchObject({
      hash: "cc".repeat(32),
      type: "OUT",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: "1000000",
      fee: "500",
      feesPayer: VALID_ADDRESS,
      failed: false,
      id: 42,
    });
    expect(result!.value).toBe(String(BigInt(1000000) + BigInt(500)));
  });

  // The send and receive cancel, so the fee is the only net effect on-chain.
  it("names the account as fee payer on a self-transfer", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      total: -500,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS,
        transferAmount: "1000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      amount: "0",
      fee: "500",
      value: "500",
      feesPayer: VALID_ADDRESS,
    });
  });

  it("should keep a transfer received on another alias of the account", () => {
    const { cost: _omitted, ...withoutCost } = baseTx;
    const tx: WalletProxyTransaction = {
      ...withoutCost,
      origin: { type: "account", address: VALID_ADDRESS_2 },
      total: 2000000,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: VALID_ADDRESS_ALIAS,
        transferAmount: "2000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      sender: VALID_ADDRESS_2,
      recipient: VALID_ADDRESS_ALIAS,
      amount: "2000000",
      value: "2000000",
    });
  });

  it("should keep a transfer sent from another alias of the account", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_ALIAS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      sender: VALID_ADDRESS_ALIAS,
      recipient: VALID_ADDRESS_2,
      amount: "1000000",
      value: "1000500",
      feesPayer: VALID_ADDRESS,
    });
  });

  it("should charge only the fee for a transfer between two aliases of the account", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      total: -500,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_ALIAS,
        transferDestination: VALID_ADDRESS_ALIAS_2,
        transferAmount: "1000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      sender: VALID_ADDRESS_ALIAS,
      recipient: VALID_ADDRESS_ALIAS_2,
      amount: "0",
      fee: "500",
      value: "500",
    });
  });

  it("should charge only the fee for a transfer from another alias to the queried address", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      total: -500,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_ALIAS,
        transferDestination: VALID_ADDRESS,
        transferAmount: "1000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      amount: "0",
      value: "500",
    });
  });

  it("names the sender as fee payer on an incoming transfer", () => {
    const { cost: _omitted, ...withoutCost } = baseTx;
    const tx: WalletProxyTransaction = {
      ...withoutCost,
      origin: { type: "account", address: VALID_ADDRESS_2 },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: VALID_ADDRESS,
        transferAmount: "2000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      fee: "0",
      feesPayer: VALID_ADDRESS_2,
    });
  });

  it("reports the whole transaction cost to the recipient, which paid none of it", () => {
    const { cost: _omitted, ...withoutCost } = baseTx;
    const tx: WalletProxyTransaction = {
      ...withoutCost,
      transactionCost: "1373330",
      origin: { type: "account", address: VALID_ADDRESS_2 },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: VALID_ADDRESS,
        transferAmount: "222000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      fee: "0",
      transactionFee: "1373330",
      value: "222000000",
      feesPayer: VALID_ADDRESS_2,
    });
  });

  it("falls back to the payer's cost when the proxy reports no transaction cost", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      fee: "500",
      transactionFee: "500",
    });
  });

  it("names the sponsor as fee payer, and charges the sponsored sender nothing", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      cost: "0",
      transactionCost: "800",
      sponsor: { sponsor: SPONSOR, cost: "800" },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      fee: "0",
      transactionFee: "800",
      value: "1000000",
      feesPayer: SPONSOR,
    });
  });

  it("reads a sponsored cost off the sponsor when the proxy reports no transaction cost", () => {
    const sponsored = {
      sponsor: { sponsor: SPONSOR, cost: "800" },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
      },
    } as const;
    const { cost: _omitted, ...withoutCost } = baseTx;
    const senderView: WalletProxyTransaction = { ...baseTx, ...sponsored, cost: "0" };
    const recipientView: WalletProxyTransaction = {
      ...withoutCost,
      ...sponsored,
      origin: { type: "account", address: VALID_ADDRESS },
    };

    expect(parseTransaction(context, senderView, VALID_ADDRESS)).toMatchObject({
      fee: "0",
      transactionFee: "800",
    });
    expect(parseTransaction(context, recipientView, VALID_ADDRESS_2)).toMatchObject({
      fee: "0",
      transactionFee: "800",
    });
  });

  it("names no fee payer when the origin carries no address", () => {
    const tx = {
      ...baseTx,
      origin: { type: "account" },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: VALID_ADDRESS,
        transferAmount: "2000000",
      },
    } as WalletProxyTransaction;

    expect(parseTransaction(context, tx, VALID_ADDRESS)).not.toHaveProperty("feesPayer");
  });

  it("should parse an incoming transfer", () => {
    const { cost: _omitted, ...withoutCost } = baseTx;
    const tx: WalletProxyTransaction = {
      ...withoutCost,
      origin: { type: "account", address: VALID_ADDRESS_2 },
      total: 2000000,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: VALID_ADDRESS,
        transferAmount: "2000000",
      },
    };

    const result = parseTransaction(context, tx, VALID_ADDRESS);

    expect(result).toMatchObject({
      type: "IN",
      amount: "2000000",
      value: "2000000",
    });
  });

  it("should return null when address is neither sender nor recipient", () => {
    const { cost: _omitted, ...withoutCost } = baseTx;
    const tx: WalletProxyTransaction = {
      ...withoutCost,
      origin: { type: "account", address: VALID_ADDRESS_2 },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh",
        transferAmount: "1000",
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toBeNull();
  });

  // A rejection is reported without any of the transfer fields, and only to the
  // account that paid: there is no counterparty row to parse.
  const rejectedTx = (overrides?: Partial<WalletProxyTransaction>): WalletProxyTransaction =>
    ({
      ...baseTx,
      cost: 300,
      details: { type: "transfer", outcome: "reject", rejectReason: "InvalidNonce" },
      ...overrides,
    }) as WalletProxyTransaction;

  it("charges the sender for a rejected transfer, which reports no counterparty", () => {
    const result = parseTransaction(context, rejectedTx(), VALID_ADDRESS);

    expect(result).toMatchObject({
      type: "OUT",
      failed: true,
      value: "300",
      fee: "300",
      feesPayer: VALID_ADDRESS,
      amount: "0",
      recipient: "",
    });
  });

  it("returns null for a rejected transfer the account did not pay for", () => {
    const paidByAnother = rejectedTx({ origin: { type: "account", address: VALID_ADDRESS_2 } });

    expect(parseTransaction(context, paidByAnother, VALID_ADDRESS)).toBeNull();
  });

  it("should return memo as undefined when CBOR decoding fails", () => {
    const { decodeMemoFromCbor } = jest.requireMock("@ledgerhq/concordium-core");
    decodeMemoFromCbor.mockImplementation(() => {
      throw new Error("invalid CBOR");
    });

    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transferWithMemo",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
        memo: "deadbeef",
      },
    };

    const result = parseTransaction(context, tx, VALID_ADDRESS);

    expect(result).not.toBeNull();
    expect(result!.memo).toBeUndefined();
  });
});

describe("parseTransaction, PLT", () => {
  // Shaped after a real testnet tokenUpdate: a 6-decimal token, and a cost the
  // proxy reports only to the sender.
  const outgoingTx: WalletProxyTransaction = {
    id: 2995554,
    blockTime: 1761895039.005,
    blockHash: "8372",
    blockHeight: 34907771,
    transactionHash: "4e41".repeat(16),
    cost: 595400,
    origin: { type: "self" },
    total: -595400,
    details: {
      type: "tokenUpdate",
      outcome: "success",
      transferSource: VALID_ADDRESS,
      transferDestination: VALID_ADDRESS_2,
      tokenId: "trUSDT",
      tokenTransferAmount: { value: "3000000", decimals: 6 },
    },
  };

  // An incoming transfer omits `cost` entirely rather than reporting zero.
  const incomingTx: WalletProxyTransaction = {
    id: 2994831,
    blockTime: 1761748654.85,
    blockHash: "da2e",
    blockHeight: 34834600,
    transactionHash: "ebcf".repeat(16),
    origin: { type: "account", address: VALID_ADDRESS_2 },
    total: 0,
    details: {
      type: "tokenUpdate",
      outcome: "success",
      transferSource: VALID_ADDRESS_2,
      transferDestination: VALID_ADDRESS,
      tokenId: "trUSDT",
      tokenTransferAmount: { value: "20000000", decimals: 6 },
    },
  };

  beforeEach(() => {
    const { decodeMemoFromCbor } = jest.requireMock("@ledgerhq/concordium-core");
    decodeMemoFromCbor.mockReset();
    decodeMemoFromCbor.mockReturnValue("decoded memo");
  });

  it("parses an outgoing PLT transfer, carrying the token and its denomination", () => {
    expect(parseTransaction(context, outgoingTx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: "3000000",
      fee: "595400",
      feesPayer: VALID_ADDRESS,
      tokenId: "trUSDT",
      decimals: 6,
      failed: false,
    });
  });

  it("values an outgoing PLT transfer at the token amount, never the amount plus the fee", () => {
    expect(parseTransaction(context, outgoingTx, VALID_ADDRESS)!.value).toBe("3000000");
  });

  it("parses an incoming PLT transfer with no fee, since the recipient paid none", () => {
    expect(parseTransaction(context, incomingTx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      value: "20000000",
      fee: "0",
      feesPayer: VALID_ADDRESS_2,
      tokenId: "trUSDT",
    });
  });

  it("should keep a PLT transfer received on another alias of the account", () => {
    const tx = {
      ...incomingTx,
      details: { ...incomingTx.details, transferDestination: VALID_ADDRESS_ALIAS },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      recipient: VALID_ADDRESS_ALIAS,
      value: "20000000",
      tokenId: "trUSDT",
    });
  });

  it("should move no token between two aliases of the account, leaving the fee to pay", () => {
    const tx = {
      ...outgoingTx,
      details: {
        ...outgoingTx.details,
        transferSource: VALID_ADDRESS_ALIAS,
        transferDestination: VALID_ADDRESS_ALIAS_2,
      },
    };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      sender: VALID_ADDRESS_ALIAS,
      recipient: VALID_ADDRESS_ALIAS_2,
      amount: "0",
      value: "0",
      fee: "595400",
      tokenId: "trUSDT",
    });
  });

  it("ignores a cost reported on a row the account did not pay for", () => {
    // Reading it would raise a FEES operation debiting the recipient's CCD, and
    // an operation id embeds its type, so the correction could not replace it.
    const withCost = { ...incomingTx, cost: 595400 } as WalletProxyTransaction;

    expect(parseTransaction(context, withCost, VALID_ADDRESS)!.fee).toBe("0");
  });

  it("decodes a PLT memo, which is CBOR exactly as a CCD memo is", () => {
    const tx = { ...outgoingTx, details: { ...outgoingTx.details, memo: "78ab31" } };

    expect(parseTransaction(context, tx, VALID_ADDRESS)!.memo).toBe("decoded memo");
  });

  // Only the PLT decoder has this fallback, so this is what pins the PLT path to
  // `decodePltMemo` rather than to the CCD decoder, which drops what it cannot
  // parse. Memos written before the wallet encoded its content arrive this way.
  it("falls back to raw text for a memo that is not CBOR", () => {
    const { decodeMemoFromCbor } = jest.requireMock("@ledgerhq/concordium-core");
    decodeMemoFromCbor.mockImplementation(() => {
      throw new Error("not CBOR");
    });
    const memo = Buffer.from("invoice 42", "utf8").toString("hex");
    const tx = { ...outgoingTx, details: { ...outgoingTx.details, memo } };

    expect(parseTransaction(context, tx, VALID_ADDRESS)!.memo).toBe("invoice 42");
  });

  it("returns null when the address is neither source nor destination", () => {
    expect(parseTransaction(context, incomingTx, "someone-else")).toBeNull();
  });

  const nonTransfer: WalletProxyTransaction = {
    ...outgoingTx,
    details: { type: "tokenUpdate", outcome: "success", description: "Token update" },
  };

  it("charges the payer for a tokenUpdate that is not a transfer, rather than losing it", () => {
    // A mint, burn, pause or batch: nothing token-side is readable, but the CCD
    // left the account and would otherwise show as an unexplained debit.
    expect(parseTransaction(context, nonTransfer, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      value: "595400",
      fee: "595400",
      feesPayer: VALID_ADDRESS,
      failed: false,
    });
    expect(parseTransaction(context, nonTransfer, VALID_ADDRESS)).not.toHaveProperty("tokenId");
  });

  it("returns null for a non-transfer tokenUpdate the account did not pay for", () => {
    const paidByAnother = { ...nonTransfer, origin: { type: "account" } } as WalletProxyTransaction;

    expect(parseTransaction(context, paidByAnother, VALID_ADDRESS)).toBeNull();
  });

  it("does not read an absent transfer amount as zero", () => {
    const { tokenTransferAmount: _dropped, ...detailsWithoutAmount } = outgoingTx.details;
    const tx: WalletProxyTransaction = { ...outgoingTx, details: detailsWithoutAmount };

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      amount: "0",
      value: "595400",
    });
  });

  it("refuses a denomination that is not a whole non-negative count of decimals", () => {
    const withBadDecimals = {
      ...outgoingTx,
      details: {
        ...outgoingTx.details,
        tokenTransferAmount: { value: "3000000", decimals: -1 },
      },
    } as WalletProxyTransaction;

    expect(parseTransaction(context, withBadDecimals, VALID_ADDRESS)).not.toHaveProperty(
      "decimals",
    );
  });

  describe("rejected", () => {
    const rejectedTx: WalletProxyTransaction = {
      ...outgoingTx,
      details: {
        type: "tokenUpdate",
        outcome: "reject",
        rejectReason: "Token update transaction failed",
        rawRejectReason: {
          tag: "TokenUpdateTransactionFailed",
          contents: { tokenId: "trUSDT", type: "operationNotPermitted" },
        },
      },
    };

    it("keeps the operation on its token, worth nothing, when the reason names one", () => {
      expect(parseTransaction(context, rejectedTx, VALID_ADDRESS)).toMatchObject({
        type: "OUT",
        tokenId: "trUSDT",
        value: "0",
        fee: "595400",
        failed: true,
      });
    });

    it("reads the token id NonExistentTokenId names directly", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        details: {
          ...rejectedTx.details,
          rawRejectReason: { tag: "NonExistentTokenId", contents: "trUSDT" },
        },
      };

      expect(parseTransaction(context, tx, VALID_ADDRESS)!.tokenId).toBe("trUSDT");
    });

    it("degrades to a plain CCD cost when the reason names no token", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        details: {
          ...rejectedTx.details,
          rawRejectReason: { tag: "InvalidNonce" },
        },
      };

      const result = parseTransaction(context, tx, VALID_ADDRESS);

      expect(result!.tokenId).toBeUndefined();
      expect(result!.value).toBe("595400");
    });

    it("reports nothing to an account that did not pay the fee", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        origin: { type: "account", address: VALID_ADDRESS_2 },
      };

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toBeNull();
    });

    it("carries the cause the reason narrows to", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        details: {
          ...rejectedTx.details,
          rawRejectReason: {
            tag: "TokenUpdateTransactionFailed",
            contents: { tokenId: "trUSDT", type: "tokenBalanceInsufficient" },
          },
        },
      };

      expect(parseTransaction(context, tx, VALID_ADDRESS)!.rejectCode).toBe("insufficientBalance");
    });

    it("carries the generic cause for a module reason it cannot narrow", () => {
      expect(parseTransaction(context, rejectedTx, VALID_ADDRESS)!.rejectCode).toBe("rejected");
    });

    // `failed` already says the transfer did not happen. A PLT cause on a
    // failure the chain attributed elsewhere would explain the wrong thing.
    it("leaves the cause absent when the reason is not a PLT one", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        details: {
          ...rejectedTx.details,
          rawRejectReason: { tag: "InvalidNonce" },
        },
      };

      expect(parseTransaction(context, tx, VALID_ADDRESS)!.rejectCode).toBeUndefined();
    });

    it("leaves the cause absent on a successful transfer", () => {
      expect(parseTransaction(context, outgoingTx, VALID_ADDRESS)!.rejectCode).toBeUndefined();
    });
  });
});

const sentTx = (
  details: WalletProxyTransaction["details"],
  overrides?: Partial<WalletProxyTransaction>,
): WalletProxyTransaction => ({
  id: 3012345,
  blockTime: 1763000000.5,
  blockHash: "aabb",
  blockHeight: 51227394,
  transactionHash: "83b1".repeat(16),
  origin: { type: "self" },
  cost: "4029312",
  transactionCost: "4029312",
  total: "-4029312",
  details,
  ...overrides,
});

describe("parseTransaction, other transaction types", () => {
  const receivedTx = (
    details: WalletProxyTransaction["details"],
    overrides?: Partial<WalletProxyTransaction>,
  ): WalletProxyTransaction => {
    const { cost: _omitted, ...withoutCost } = sentTx(details);
    return { ...withoutCost, origin: { type: "account", address: VALID_ADDRESS_2 }, ...overrides };
  };

  const THIRD_ADDRESS = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";
  const sponsorship = { sponsor: SPONSOR, cost: "4029312" };

  beforeEach(() => {
    const { decodeMemoFromCbor } = jest.requireMock("@ledgerhq/concordium-core");
    decodeMemoFromCbor.mockReset();
    decodeMemoFromCbor.mockReturnValue("decoded memo");
  });

  it.each([
    ["registerData", {}],
    ["deployModule", {}],
    ["initContract", { subtotal: "0" }],
    ["update", { subtotal: "0" }],
    ["configureBaker", {}],
    ["configureDelegation", {}],
    ["updateAccountKeys", {}],
    ["updateCredentials", {}],
    ["encryptedAmountTransfer", {}],
  ])("charges the sender the fee of a %s that moves no CCD", (type, amounts) => {
    const tx = sentTx({ type, outcome: "success" }, amounts);

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "FEES",
      sender: VALID_ADDRESS,
      recipient: "",
      amount: "0",
      fee: "4029312",
      value: "4029312",
      transactionFee: "4029312",
      feesPayer: VALID_ADDRESS,
      failed: false,
    });
  });

  it.each(["update", "initContract", "deployModule", "transferWithSchedule"])(
    "charges the sender the fee of a rejected %s, as a failed operation",
    type => {
      const tx = sentTx({ type, outcome: "reject", rejectReason: "Rejected" });

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
        type: "FEES",
        amount: "0",
        value: "4029312",
        failed: true,
      });
    },
  );

  it.each([
    ["update", "a deposit into a contract"],
    ["initContract", "a deposit into a new contract"],
    ["transferToEncrypted", "a shielded amount"],
  ])("reads a sent %s as outgoing (%s)", type => {
    const tx = sentTx({ type, outcome: "success" }, { subtotal: "-500000", total: "-4529312" });

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      sender: VALID_ADDRESS,
      recipient: "",
      amount: "500000",
      fee: "4029312",
      value: "4529312",
    });
  });

  it("reads a contract call that pays its sender back more than it sent as incoming", () => {
    const tx = sentTx({ type: "update", outcome: "success" }, { subtotal: "7", total: "-4029305" });

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      sender: "",
      recipient: VALID_ADDRESS,
      amount: "7",
      fee: "4029312",
      value: "7",
    });
  });

  it("reads an unshielded amount as incoming", () => {
    const tx = sentTx(
      { type: "transferToPublic", outcome: "success" },
      { subtotal: "900", total: "-4028412" },
    );

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      value: "900",
      fee: "4029312",
      feesPayer: VALID_ADDRESS,
    });
  });

  it("reads numeric amounts as well as strings", () => {
    const tx = sentTx(
      { type: "update", outcome: "success" },
      { cost: 100, transactionCost: 100, subtotal: -500, total: -600 },
    );

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      value: "600",
    });
  });

  it("reads a contract payout as incoming, with no sender, as the caller did not send it", () => {
    const tx = receivedTx({ type: "update", outcome: "success" }, { total: "1530000000" });

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      sender: "",
      recipient: VALID_ADDRESS,
      amount: "1530000000",
      fee: "0",
      value: "1530000000",
      transactionFee: "4029312",
      feesPayer: VALID_ADDRESS_2,
    });
  });

  it("returns null for a contract call of another account that paid this one nothing", () => {
    const tx = receivedTx({ type: "update", outcome: "success" }, { total: "0" });

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toBeNull();
  });

  it("returns null for an encrypted amount received, which moves no public CCD", () => {
    const tx = receivedTx({ type: "encryptedAmountTransfer", outcome: "success" }, { total: "0" });

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toBeNull();
  });

  describe("scheduled transfers", () => {
    const details = {
      type: "transferWithScheduleAndMemo",
      outcome: "success",
      transferDestination: VALID_ADDRESS_2,
      transferAmount: "1000000",
      memo: "6b6465706f7369742d726566",
    } as const;

    it("reads a sent one as outgoing to its destination, with its memo", () => {
      const tx = sentTx(details, { subtotal: "-1000000", total: "-5029312" });

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
        type: "OUT",
        sender: VALID_ADDRESS,
        recipient: VALID_ADDRESS_2,
        amount: "1000000",
        value: "5029312",
        memo: "decoded memo",
      });
    });

    it("reads one received on another alias as incoming from its sender, with its memo", () => {
      const tx = receivedTx(
        { ...details, transferDestination: VALID_ADDRESS_ALIAS },
        { total: "1000000" },
      );

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
        type: "IN",
        sender: VALID_ADDRESS_2,
        recipient: VALID_ADDRESS,
        amount: "1000000",
        fee: "0",
        value: "1000000",
        memo: "decoded memo",
      });
    });

    it("charges a sponsor that is no party the fee alone, though the proxy counts it a receipt", () => {
      const tx = receivedTx(
        { ...details, transferDestination: THIRD_ADDRESS },
        { cost: "4029312", sponsor: sponsorship, subtotal: "1000000", total: "-3029312" },
      );

      expect(parseTransaction(context, tx, SPONSOR)).toMatchObject({
        type: "FEES",
        amount: "0",
        value: "4029312",
        memo: undefined,
      });
    });
  });

  it("keeps the memo of a sent encrypted transfer on the fee it cost", () => {
    const tx = sentTx({
      type: "encryptedAmountTransferWithMemo",
      outcome: "success",
      memo: "6b6465706f7369742d726566",
    });

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
      type: "FEES",
      memo: "decoded memo",
    });
  });

  describe("sponsored by another account", () => {
    it.each([
      ["initContract", "-500", "-4029812"],
      ["transferToPublic", "500", "-4028812"],
    ])(
      "charges the sponsor of a %s the fee alone, though the proxy counts the sender's amount",
      (type, subtotal, total) => {
        const tx = receivedTx(
          { type, outcome: "success" },
          { cost: "4029312", sponsor: sponsorship, subtotal, total },
        );

        expect(parseTransaction(context, tx, SPONSOR)).toMatchObject({
          type: "FEES",
          sender: SPONSOR,
          amount: "0",
          value: "4029312",
          feesPayer: SPONSOR,
        });
      },
    );

    it("shows a sponsored contract deposit to its sender without a fee", () => {
      const tx = sentTx(
        { type: "update", outcome: "success" },
        { cost: "0", sponsor: sponsorship, subtotal: "-500000", total: "-500000" },
      );

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
        type: "OUT",
        amount: "500000",
        fee: "0",
        value: "500000",
        feesPayer: SPONSOR,
      });
    });

    it.each(["success", "reject"] as const)(
      "returns null to the sender of a sponsored call that moved nothing (%s)",
      outcome => {
        const tx = sentTx(
          { type: "update", outcome },
          { cost: "0", sponsor: sponsorship, total: "0" },
        );

        expect(parseTransaction(context, tx, VALID_ADDRESS)).toBeNull();
      },
    );

    it("charges the sponsor the fee of a call that also pays it, and keeps the payout apart", () => {
      const tx = receivedTx(
        { type: "update", outcome: "success" },
        { cost: "4029312", sponsor: sponsorship, subtotal: "10000", total: "-4019312" },
      );

      expect(parseTransaction(context, tx, SPONSOR)).toMatchObject({
        type: "IN",
        amount: "10000",
        value: "10000",
        fee: "4029312",
        feesPayer: SPONSOR,
      });
    });
  });

  describe("sponsored by the queried account", () => {
    const aliasSponsorship = { sponsor: VALID_ADDRESS_ALIAS, cost: "4029312" };
    const details = {
      transfer: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: SPONSOR,
        transferAmount: "1000000",
      },
      "token transfer": {
        type: "tokenUpdate",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: SPONSOR,
        tokenId: "trUSDT",
        tokenTransferAmount: { value: "20000000", decimals: 6 },
        memo: "6b6465706f7369742d726566",
      },
      "token update that is no transfer": { type: "tokenUpdate", outcome: "success" },
      "rejected transfer": { type: "transfer", outcome: "reject" },
      "rejected token update": { type: "tokenUpdate", outcome: "reject" },
      "rejected contract call": { type: "update", outcome: "reject" },
    } as const;

    it.each(Object.keys(details) as (keyof typeof details)[])(
      "charges the fee of another account's %s, as CCD",
      kind => {
        const tx = receivedTx(details[kind], {
          cost: "4029312",
          sponsor: aliasSponsorship,
          total: "-4029312",
        });
        const result = parseTransaction(context, tx, VALID_ADDRESS);

        expect(result).toMatchObject({
          type: "FEES",
          sender: VALID_ADDRESS,
          recipient: "",
          amount: "0",
          fee: "4029312",
          value: "4029312",
          memo: undefined,
          feesPayer: VALID_ADDRESS,
          failed: details[kind].outcome === "reject",
        });
        expect(result).not.toHaveProperty("tokenId");
      },
    );

    it("reads the fee off the sponsor on a proxy that leaves the cost out of its rows", () => {
      const tx = receivedTx(details.transfer, { sponsor: aliasSponsorship, total: "0" });

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
        type: "FEES",
        fee: "4029312",
        value: "4029312",
      });
    });

    it("keeps a transfer it received incoming, and the fee it paid on it", () => {
      const tx = receivedTx(
        { ...details.transfer, transferDestination: VALID_ADDRESS },
        { cost: "4029312", sponsor: aliasSponsorship, subtotal: "1000000", total: "-3029312" },
      );

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
        type: "IN",
        value: "1000000",
        fee: "4029312",
        transactionFee: "4029312",
        feesPayer: VALID_ADDRESS,
      });
    });

    it("keeps a token transfer it received incoming, and the fee it paid on it", () => {
      const tx = receivedTx(
        { ...details["token transfer"], transferDestination: VALID_ADDRESS },
        { cost: "4029312", sponsor: aliasSponsorship, total: "-4029312" },
      );

      expect(parseTransaction(context, tx, VALID_ADDRESS)).toMatchObject({
        type: "IN",
        tokenId: "trUSDT",
        value: "20000000",
        fee: "4029312",
        transactionFee: "4029312",
        feesPayer: VALID_ADDRESS,
      });
    });
  });

  it.each([
    ["total", "1.5"],
    ["total", 2 ** 53],
    ["subtotal", "1.5"],
    ["subtotal", ""],
  ] as const)("refuses a %s of %p, which is not an exact amount", (field, amount) => {
    const build = field === "total" ? receivedTx : sentTx;
    const tx = build({ type: "update", outcome: "success" }, { [field]: amount });

    expect(() => parseTransaction(context, tx, VALID_ADDRESS)).toThrow(
      "carries no readable amount",
    );
  });

  it("refuses a payout with no total, rather than reading it as zero", () => {
    const { total: _dropped, ...withoutTotal } = receivedTx({ type: "update", outcome: "success" });

    expect(() =>
      parseTransaction(context, withoutTotal as WalletProxyTransaction, VALID_ADDRESS),
    ).toThrow("carries no readable amount");
  });

  it("refuses a scheduled transfer with no amount, rather than reading it as zero", () => {
    const tx = sentTx({ type: "transferWithSchedule", outcome: "success" });

    expect(() => parseTransaction(context, tx, VALID_ADDRESS)).toThrow(
      "carries no readable amount",
    );
  });

  const outsideAccounts: Omit<WalletProxyTransaction, "details"> = {
    id: 3012346,
    blockTime: 1763000000.5,
    blockHash: "aabb",
    blockHeight: 51227395,
    origin: { type: "none" },
    total: "0",
  };

  it.each<[string, WalletProxyTransaction]>([
    [
      "a reward",
      {
        ...outsideAccounts,
        origin: { type: "reward" },
        total: "5000",
        details: { type: "bakingReward", outcome: "success" },
      },
    ],
    [
      "a validator event",
      { ...outsideAccounts, details: { type: "validatorSuspended", outcome: "success" } },
    ],
    [
      "a chain update",
      {
        ...outsideAccounts,
        transactionHash: "e0d1".repeat(16),
        transactionCost: "0",
        details: { type: "chainUpdate", outcome: "success" },
      },
    ],
  ])("returns null for %s", (_name, tx) => {
    expect(parseTransaction(context, tx, VALID_ADDRESS)).toBeNull();
  });

  it("returns null for a row with no hash to identify the operation", () => {
    const { transactionHash: _dropped, ...tx } = sentTx({
      type: "registerData",
      outcome: "success",
    });

    expect(parseTransaction(context, tx, VALID_ADDRESS)).toBeNull();
  });
});

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch transactions and return RawOperations", async () => {
    const blockTime = Date.now() / 1000;
    getTransactionsMock.mockResolvedValue({
      transactions: [
        {
          id: 42,
          blockTime,
          blockHash: "aabb",
          blockHeight: 1000,
          transactionHash: "cc".repeat(32),
          cost: 500,
          origin: { type: "self" },
          details: {
            type: "transfer",
            outcome: "success",
            transferSource: VALID_ADDRESS,
            transferDestination: VALID_ADDRESS_2,
            transferAmount: "1000000",
          },
          total: -1000500,
        },
      ],
      count: 1,
      limit: 100,
      order: "descending",
    });

    const result = await listOperations(context, VALID_ADDRESS, { minHeight: 0 });

    expect(getTransactionsMock).toHaveBeenCalledWith(context, VALID_ADDRESS, {
      limit: 100,
      order: "d",
      includeRawRejectReason: true,
      includeRewards: "none",
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      hash: "cc".repeat(32),
      type: "OUT",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: "1000000",
      fee: "500",
    });
    expect(result.items[0].value).toBe(String(BigInt(1000000) + BigInt(500)));
    expect(result.next).toBeUndefined();
  });

  it("should always request the raw reject reason", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [],
      count: 0,
      limit: 100,
      order: "descending",
    });

    await listOperations(context, VALID_ADDRESS, { minHeight: 0 });

    // The proxy tests the parameter for presence, so `false` would enable it.
    const [, , params] = getTransactionsMock.mock.calls[0];
    expect(params.includeRawRejectReason).toBe(true);
  });

  it("should pass blockHeightFrom when minHeight > 0", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [],
      count: 0,
      limit: 100,
      order: "descending",
    });

    await listOperations(context, VALID_ADDRESS, { minHeight: 500 });

    expect(getTransactionsMock).toHaveBeenCalledWith(context, VALID_ADDRESS, {
      limit: 100,
      order: "d",
      includeRawRejectReason: true,
      includeRewards: "none",
      blockHeightFrom: 500,
    });
  });

  it("should pass cursor as from param", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [],
      count: 0,
      limit: 100,
      order: "descending",
    });

    await listOperations(context, VALID_ADDRESS, { minHeight: 0, cursor: "42" });

    expect(getTransactionsMock).toHaveBeenCalledWith(context, VALID_ADDRESS, {
      limit: 100,
      order: "d",
      includeRawRejectReason: true,
      includeRewards: "none",
      from: "42",
    });
  });

  it("should return next cursor when more pages exist", async () => {
    const txs = Array.from({ length: 100 }, (_, i) => ({
      id: 200 - i,
      blockTime: Date.now() / 1000,
      blockHash: "aabb",
      blockHeight: 1000,
      transactionHash: `${"cc".repeat(31)}${String(i).padStart(2, "0")}`,
      cost: 100,
      origin: { type: "self" as const },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000",
      },
      total: -1100,
    }));

    getTransactionsMock.mockResolvedValue({
      transactions: txs,
      count: 100,
      limit: 100,
      order: "descending",
    });

    const result = await listOperations(context, VALID_ADDRESS, { minHeight: 0 });

    expect(result.next).toBe("101");
  });

  it("returns a cursor when the proxy caps the requested limit", async () => {
    // The proxy serves at most 1000 rows and echoes the capped limit, so a full
    // page is measured against that, not against what was asked for.
    const txs = Array.from({ length: 1000 }, (_, i) => ({
      id: 2000 - i,
      blockTime: Date.now() / 1000,
      blockHash: "aabb",
      blockHeight: 1000,
      transactionHash: `${"cc".repeat(30)}${String(i).padStart(4, "0")}`,
      cost: 100,
      origin: { type: "self" as const },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000",
      },
      total: -1100,
    }));

    getTransactionsMock.mockResolvedValue({
      transactions: txs,
      count: 1000,
      limit: 1000,
      order: "descending",
    });

    const result = await listOperations(context, VALID_ADDRESS, { minHeight: 0, limit: 2000 });

    expect(getTransactionsMock.mock.calls[0][2]).toMatchObject({ limit: 2000 });
    expect(result.items).toHaveLength(1000);
    expect(result.next).toBe("1001");
  });

  it("should filter rewards", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [
        {
          id: 10,
          blockTime: Date.now() / 1000,
          blockHash: "aabb",
          blockHeight: 1000,
          origin: { type: "reward" },
          details: { type: "bakingReward", outcome: "success" },
          total: 5000,
        },
      ],
      count: 1,
      limit: 100,
      order: "descending",
    });

    const result = await listOperations(context, VALID_ADDRESS, { minHeight: 0 });

    expect(result.items).toHaveLength(0);
  });

  it("keeps the cursor of a page that ends on a validator event, which has no hash", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [
        {
          id: 12,
          blockTime: 1763000000,
          blockHeight: 1001,
          transactionHash: "ab".repeat(32),
          cost: "300",
          origin: { type: "self" },
          details: { type: "registerData", outcome: "success" },
          total: "-300",
        },
        {
          id: 11,
          blockTime: 1763000000,
          blockHeight: 1000,
          origin: { type: "none" },
          details: { type: "validatorPrimedForSuspension", outcome: "success" },
          total: "0",
        },
      ],
      count: 2,
      limit: 2,
      order: "descending",
    });

    const result = await listOperations(context, VALID_ADDRESS, { minHeight: 0, limit: 2 });

    expect(result.items.map(({ type, value }) => [type, value])).toEqual([["FEES", "300"]]);
    expect(result.next).toBe("11");
  });

  it("reports a fetch failure rather than an empty page, which reads as the end", async () => {
    getTransactionsMock.mockRejectedValue(new Error("network error"));

    await expect(listOperations(context, VALID_ADDRESS, { minHeight: 0 })).rejects.toThrow(
      "network error",
    );
  });

  it("excludes rewards, which the parser drops and which dominate a staking account", async () => {
    getTransactionsMock.mockResolvedValue({ transactions: [], count: 0, limit: 100 });

    await listOperations(context, VALID_ADDRESS, { minHeight: 0 });

    expect(getTransactionsMock.mock.calls[0][2]).toMatchObject({ includeRewards: "none" });
  });
});
