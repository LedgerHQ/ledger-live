import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { Address } from "@ton/core";
import { BigNumber } from "bignumber.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  account,
  transaction as baseTransaction,
  jettonTransaction,
} from "../../__tests__/fixtures/common.fixtures";
import { setCoinConfig } from "../../config";
import { TON_API_MOCKED, createMockTonContext, mockTonConfig } from "../../test/context";
import { NOT_MASTER } from "../../test/history.fixtures";
import { decodePayload } from "../../test/transferBody";
import type { TonMemo, TonPayloadFormat, Transaction } from "../../types";
import { buildTonTransaction } from "../../utils";
import { parseRecipient, transferOrder } from "../craftTransaction";
import type { TonTransferOrder } from "../transferBody";

// The legacy bridge hands its payload to the Ledger library as a structure; ours is a cell, read
// back into that structure.

const SEQNO = 22;
const JETTON_WALLET = account.subAccounts?.[0].jettonWallet ?? "";

const payloadView = (payload: TonPayloadFormat | null | undefined) => {
  if (!payload) return null;
  if (payload.type !== "jetton-transfer") return payload;
  return {
    ...payload,
    destination: payload.destination.toRawString(),
    responseDestination: payload.responseDestination.toRawString(),
    forwardPayload: payload.forwardPayload?.hash().toString("hex") ?? null,
  };
};

const orderView = (order: {
  to: Address;
  seqno: number;
  amount: bigint;
  bounce: boolean;
  sendMode: number;
  validUntil: number;
  payload?: TonPayloadFormat | null;
}) => ({ ...order, to: order.to.toRawString(), payload: payloadView(order.payload) });

const legacyView = (transaction: Transaction) => {
  const { timeout, stateInit: _, ...legacy } = buildTonTransaction(transaction, SEQNO, account);
  return orderView({ ...legacy, validUntil: timeout });
};

const apiView = ({ payload, ...order }: TonTransferOrder) =>
  orderView({
    ...order,
    payload: payload && decodePayload(payload),
  });

const toIntent = (transaction: Transaction): TransactionIntent<TonMemo> =>
  ({
    intentType: "transaction",
    type: "send",
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount: BigInt(transaction.amount.toFixed()),
    asset: transaction.subAccountId
      ? { type: "jetton", assetReference: NOT_MASTER, assetOwner: account.freshAddress }
      : { type: "native" },
    useAllAmount: transaction.useAllAmount,
    sequence: BigInt(SEQNO),
    memo: transaction.comment.text
      ? { type: "string", kind: "comment", value: transaction.comment.text }
      : { type: "none" },
  }) as TransactionIntent<TonMemo>;

const comment = (text: string) => ({ isEncrypted: false, text });

describe("transferOrder parity with the legacy bridge", () => {
  const server = setupServer(
    http.get(`${TON_API_MOCKED}/jetton/wallets`, () =>
      HttpResponse.json({
        jetton_wallets: [{ address: JETTON_WALLET, balance: "5000000", jetton: NOT_MASTER }],
      }),
    ),
  );
  const context = createMockTonContext();

  beforeAll(() => {
    setCoinConfig(() => mockTonConfig);
    server.listen({ onUnhandledRequest: "error" });
  });
  let now: jest.SpyInstance;

  beforeEach(() => {
    now = jest.spyOn(Date, "now").mockReturnValue(1_000_000_000_000);
  });
  afterEach(() => now.mockRestore());
  afterAll(() => server.close());

  it.each<[string, Transaction]>([
    ["a transfer of a specific amount", baseTransaction],
    [
      "a transfer whose comment text is missing",
      { ...baseTransaction, comment: comment(undefined as unknown as string) },
    ],
    ["a transfer with a comment", { ...baseTransaction, comment: comment("valid comment") }],
    [
      "a send-max transfer with a comment",
      { ...baseTransaction, comment: comment("valid comment"), useAllAmount: true },
    ],
    [
      "a transfer to a raw address",
      {
        ...baseTransaction,
        recipient: "0:8EBD02D8BD371B8B9B4BF4C683373B95977F89DEF0138A6366F723B95CF69F2D",
      },
    ],
    ["a jetton transfer of a specific amount", jettonTransaction],
    ["a jetton transfer with a comment", { ...jettonTransaction, comment: comment("memo 42") }],
  ])("builds %s as the legacy bridge does", async (_, transaction) => {
    const order = await transferOrder(
      context,
      toIntent(transaction),
      parseRecipient(transaction.recipient),
    );

    expect(apiView(order)).toEqual(legacyView(transaction));
  });

  it("builds a jetton send-max with the amount prepareTransaction set, as the legacy bridge does", async () => {
    const transaction = {
      ...jettonTransaction,
      useAllAmount: true,
      amount: new BigNumber(4000000),
    };
    const order = await transferOrder(
      context,
      toIntent(transaction),
      parseRecipient(transaction.recipient),
    );

    expect(apiView(order)).toEqual(legacyView(transaction));
  });
});
