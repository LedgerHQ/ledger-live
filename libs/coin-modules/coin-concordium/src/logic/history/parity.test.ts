import { createFixtureConfig, VALID_ADDRESS, VALID_ADDRESS_2 } from "../../test/fixtures";
import { blockEffect, listedEffect } from "../../test/historyParity";
import type { WalletProxyTransaction } from "../../types";
import { getBlock } from "./getBlock";
import { parseTransaction } from "./listOperations";

jest.mock("./getBlockInfo", () => ({ getBlockInfo: async () => ({ hash: "block-hash" }) }));

jest.mock("../../network/proxyClient", () => ({ getBlockTransactionEvents: jest.fn() }));

const { getBlockTransactionEvents } = jest.requireMock("../../network/proxyClient");

const SENDER = VALID_ADDRESS;
const SPONSOR = VALID_ADDRESS_2;
const RECIPIENT = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";
const HASH = "ab".repeat(32);
const COST = "4000";

const account = (address: string) => ({ type: "AddressAccount", address });
const contract = { type: "AddressContract", address: { index: 1, subindex: 0 } };

interface Kind {
  kind: string;
  details: Pick<WalletProxyTransaction["details"], "type"> & Record<string, unknown>;
  /** Absent for a rejection. */
  events?: object[];
  /** As the proxy reports it to each account, absent when it sees nothing moved. */
  subtotal: { sender?: string; sponsor?: string };
}

const transferTo = (recipient: string, subtotal: Kind["subtotal"]): Kind => ({
  kind: "transfer",
  details: {
    type: "transfer",
    transferSource: SENDER,
    transferDestination: recipient,
    transferAmount: "1000",
  },
  events: [{ tag: "Transferred", amount: "1000", from: account(SENDER), to: account(recipient) }],
  subtotal,
});

const callPaidBack = (payout: string, net: string): Kind => ({
  kind: `contract call of 100 that returns ${payout}`,
  details: { type: "update" },
  events: [
    { tag: "Interrupted", address: contract.address },
    { tag: "Transferred", amount: payout, from: contract, to: account(SENDER) },
    { tag: "Resumed", address: contract.address, success: true },
    { tag: "Updated", amount: "100", address: contract.address, instigator: account(SENDER) },
  ],
  subtotal: { sender: net },
});

const FUNDED_INIT: Kind = {
  kind: "funded contract initialization",
  details: { type: "initContract" },
  events: [{ tag: "ContractInitialized", amount: "700" }],
  subtotal: { sender: "-700", sponsor: "-700" },
};

const UNSHIELDED: Kind = {
  kind: "unshielded amount",
  details: { type: "transferToPublic" },
  events: [
    { tag: "EncryptedAmountsRemoved", account: SENDER, newAmount: "c0de", upToIndex: 0 },
    { tag: "AmountAddedByDecryption", account: SENDER, amount: "500" },
  ],
  subtotal: { sender: "500", sponsor: "500" },
};

const SHIELDED: Kind = {
  kind: "shielded amount",
  details: { type: "transferToEncrypted" },
  events: [{ tag: "EncryptedSelfAmountAdded", account: SENDER, newAmount: "c0de", amount: "40" }],
  subtotal: { sender: "-40" },
};

const REJECTED_CALL: Kind = {
  kind: "rejected contract call",
  details: { type: "update" },
  subtotal: {},
};

const TOKEN_TRANSFER: Kind = {
  kind: "token transfer",
  details: {
    type: "tokenUpdate",
    transferSource: SENDER,
    transferDestination: RECIPIENT,
    tokenId: "t-USDT",
    tokenTransferAmount: { value: "3000000", decimals: 6 },
  },
  events: [{ tag: "TokenTransfer", tokenId: "t-USDT" }],
  subtotal: {},
};

const TRANSFER = transferTo(RECIPIENT, { sender: "-1000" });
const PARTLY_PAID_BACK = callPaidBack("20", "-80");
const FULLY_PAID_BACK = callPaidBack("100", "0");
const OVERPAID_BACK = callPaidBack("107", "7");

async function blockTransactionOf({ events }: Kind, isSponsored: boolean) {
  getBlockTransactionEvents.mockResolvedValue([
    {
      hash: HASH,
      sender: SENDER,
      cost: isSponsored ? "0" : COST,
      ...(isSponsored ? { sponsorDetails: { sponsor: SPONSOR, cost: COST } } : {}),
      result: events ? { outcome: "success", events } : { outcome: "reject" },
    },
  ]);
  const { transactions } = await getBlock(createFixtureConfig(), 1000);
  return transactions[0];
}

function rowOf(
  { details, events }: Kind,
  subtotal: string | undefined,
  view: Pick<WalletProxyTransaction, "origin" | "sponsor"> & { cost: string },
): WalletProxyTransaction {
  return {
    id: 42,
    blockTime: 1763000000,
    blockHeight: 1000,
    transactionHash: HASH,
    transactionCost: COST,
    ...(subtotal === undefined ? {} : { subtotal }),
    total: String(BigInt(subtotal ?? 0) - BigInt(view.cost)),
    details: { ...details, outcome: events ? "success" : "reject" },
    ...view,
  };
}

function listedEffectOf(row: WalletProxyTransaction, address: string) {
  const operation = parseTransaction(row, address);
  return operation && listedEffect(operation);
}

describe("listOperations and getBlock report a transaction alike", () => {
  const sponsor = { sponsor: SPONSOR, cost: COST };
  const origin = { type: "account", address: SENDER } as const;

  it.each([
    FUNDED_INIT,
    UNSHIELDED,
    SHIELDED,
    REJECTED_CALL,
    TRANSFER,
    PARTLY_PAID_BACK,
    FULLY_PAID_BACK,
    OVERPAID_BACK,
  ])("$kind, to its sender", async kind => {
    const row = rowOf(kind, kind.subtotal.sender, { origin: { type: "self" }, cost: COST });

    expect(listedEffectOf(row, SENDER)).toEqual(
      blockEffect(await blockTransactionOf(kind, false), SENDER),
    );
  });

  it.each([FUNDED_INIT, UNSHIELDED, TRANSFER, PARTLY_PAID_BACK, OVERPAID_BACK])(
    "sponsored $kind, to its sender",
    async kind => {
      const view = { origin: { type: "self" }, cost: "0", sponsor } as const;

      expect(listedEffectOf(rowOf(kind, kind.subtotal.sender, view), SENDER)).toEqual(
        blockEffect(await blockTransactionOf(kind, true), SENDER),
      );
    },
  );

  it.each([
    FUNDED_INIT,
    UNSHIELDED,
    REJECTED_CALL,
    TRANSFER,
    TOKEN_TRANSFER,
    PARTLY_PAID_BACK,
    FULLY_PAID_BACK,
  ])("sponsored $kind, to its sponsor", async kind => {
    const row = rowOf(kind, kind.subtotal.sponsor, { origin, cost: COST, sponsor });

    expect(listedEffectOf(row, SPONSOR)).toEqual(
      blockEffect(await blockTransactionOf(kind, true), SPONSOR),
    );
  });

  it("transfer to its sponsor", async () => {
    const kind = transferTo(SPONSOR, { sponsor: "1000" });
    const row = rowOf(kind, kind.subtotal.sponsor, { origin, cost: COST, sponsor });

    expect(listedEffectOf(row, SPONSOR)).toEqual(
      blockEffect(await blockTransactionOf(kind, true), SPONSOR),
    );
  });
});
