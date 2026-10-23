import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { decodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  mockAccountId,
  mockAddress,
  tonTransactionResponse,
} from "../../__tests__/fixtures/common.fixtures";
import type { TonAddressBook, TonTransaction } from "../../bridge/bridgeHelpers/api.types";
import { mapJettonTxToOps, mapTxToOps } from "../../bridge/bridgeHelpers/txn";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import {
  OWNER,
  jettonIn,
  jettonInTrace,
  jettonOut,
  jettonOutTrace,
  jettonSendTx,
} from "../../test/history.fixtures";
import type { TonOperation } from "../../types";
import { listOperations } from "../listOperations";

const legacyView = (op: TonOperation) => ({
  type: op.type,
  hash: decodeOperationId(op.id).hash,
  value: BigInt(op.value.toFixed()),
  fees: BigInt(op.fee.toFixed()),
  senders: op.senders,
  recipients: op.recipients,
  failed: op.hasFailed,
  date: op.date,
  height: op.blockHeight,
  extra: op.extra,
});

const apiView = (op: Operation) => ({
  type: op.type,
  hash: op.tx.hash,
  value: op.value,
  fees: op.tx.fees,
  senders: op.senders,
  recipients: op.recipients,
  failed: op.tx.failed,
  date: op.tx.date,
  height: op.tx.block.height,
  extra: (op.details as { familyExtra: unknown }).familyExtra,
});

const NOT_TOKEN = {
  id: TokenCurrencyIdSchema.parse("ton/jetton/eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not"),
  type: "TokenCurrency" as const,
  contractAddress: "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ton"),
  tokenType: "jetton",
  name: "Notcoin",
  ticker: "NOT",
  units: [{ name: "NOT", code: "NOT", magnitude: 9 }],
};

const base = tonTransactionResponse.transactions[0];
const inMessage = base.in_msg as NonNullable<TonTransaction["in_msg"]>;
const sentBy = (outMsgs: Partial<typeof inMessage>[]): TonTransaction => ({
  ...base,
  in_msg: null,
  out_msgs: outMsgs.map(message => ({ ...inMessage, source: base.account, ...message })),
});
const MAIN = "0:9220C181A6CFEACD11B7B8F62138DF1BB9CC82B6ED2661D2F5FAEE204B3EFB20";
const SECONDARY = "0:D49106E94D5220B7BBFAEBE253151FB7F9E5D1173FF857AE85F947E7EAF3A0D0";
const BOOK: TonAddressBook = {
  [MAIN]: { user_friendly: "EQCSIMGBps_qzRG3uPYhON8bucyCtu0mYdL1-u4gSz77IK7z" },
  [SECONDARY]: { user_friendly: "EQDUkQbpTVIgt7v66-JTFR-3-eXRFz_4V66F-Ufn6vOg0KzT" },
};

// The legacy bridge charges a send `total_fees` only, without the forward fees its messages carry.
const forwardFees = (tx: TonTransaction) =>
  tx.out_msgs.reduce((sum, message) => sum + BigInt(message.fwd_fee ?? 0), 0n);

describe("listOperations parity with the legacy bridge", () => {
  const server = setupServer();
  const context = createMockTonContext();

  const serve = ({
    transactions = [],
    transfers = [],
    traces = [],
    addressBook = {},
  }: {
    transactions?: unknown[];
    transfers?: unknown[];
    traces?: unknown[];
    addressBook?: TonAddressBook;
  }) =>
    server.use(
      http.get(`${TON_API_MOCKED}/transactions`, () =>
        HttpResponse.json({ transactions, address_book: addressBook }),
      ),
      http.get(`${TON_API_MOCKED}/jetton/transfers`, () =>
        HttpResponse.json({ jetton_transfers: transfers, address_book: {} }),
      ),
      http.get(`${TON_API_MOCKED}/traces`, () => HttpResponse.json({ traces })),
    );

  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => NOT_TOKEN,
      getTokensSyncHash: async () => "0",
    });
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe("native transactions", () => {
    const cases: [string, TonTransaction, TonAddressBook][] = [
      ["an incoming transfer that failed, without fees", base, {}],
      ["an outgoing transfer that failed", sentBy([{}]), {}],
      [
        "a multi-output outgoing transfer, aggregated",
        sentBy([
          { destination: MAIN, value: "37300000000", hash: "outMsgHashMain" },
          { destination: SECONDARY, value: "323750000", hash: "outMsgHashSecondary" },
        ]),
        BOOK,
      ],
      [
        "an outgoing transfer with a zero-value message, ignored",
        sentBy([
          {
            destination: "0:0000000000000000000000000000000000000000000000000000000000000000",
            value: "0",
            hash: "zeroValueHash",
          },
          { destination: SECONDARY, value: "5000000", hash: "valueHash" },
        ]),
        BOOK,
      ],
      [
        "several outputs to one recipient, deduplicated",
        sentBy([
          { destination: MAIN, value: "1000000", hash: "h1" },
          { destination: MAIN, value: "2000000", hash: "h2" },
        ]),
        BOOK,
      ],
    ];

    it.each(cases)(
      "maps %s as the legacy bridge does, a send's fee plus its forward fees",
      async (_, tx, addressBook) => {
        serve({ transactions: [tx], addressBook });

        const { items } = await listOperations(context, mockAddress, { minHeight: 0 });

        expect(items).toHaveLength(1);
        expect(items.map(apiView)).toEqual(
          mapTxToOps(
            mockAccountId,
            mockAddress,
            addressBook,
          )(tx)
            .map(legacyView)
            .map(op => (op.type === "OUT" ? { ...op, fees: op.fees + forwardFees(tx) } : op)),
        );
      },
    );

    it("maps an incoming transfer with fees, without the legacy fee sub-operation", async () => {
      const tx = { ...base, total_fees: "15" };
      serve({ transactions: [tx] });

      const { items } = await listOperations(context, mockAddress, { minHeight: 0 });
      const legacy = mapTxToOps(mockAccountId, mockAddress, {})(tx);

      expect(items.map(apiView)).toEqual(legacy.map(legacyView));
      expect(legacy[0].subOperations?.map(op => op.type)).toEqual(["NONE"]);
    });
  });

  describe("jetton transfers", () => {
    const tokenView = (op: TonOperation) => ({ ...legacyView(op), height: undefined });
    const apiTokenView = (op: Operation) => ({ ...apiView(op), height: undefined });

    it("maps a received jetton as the legacy bridge does, on its real block", async () => {
      serve({ transfers: [jettonIn], traces: [jettonInTrace] });

      const { items } = await listOperations(context, OWNER, { minHeight: 0 });
      const legacy = await mapJettonTxToOps(mockAccountId, OWNER, {})(jettonIn);

      expect(items.map(apiTokenView)).toEqual(legacy.map(tokenView));
      expect(legacy[0].blockHeight).toBe(1);
      expect(items[0].tx.block.height).toBe(40170273);
    });

    it("maps a sent jetton under the same hash as the legacy bridge", async () => {
      serve({ transfers: [jettonOut], traces: [jettonOutTrace] });

      const { items } = await listOperations(context, OWNER, { minHeight: 0 });
      const adjacentTransactionHashes = new Map([
        [jettonOut.transaction_hash, jettonSendTx.in_msg.hash],
      ]);
      const legacy = await mapJettonTxToOps(
        mockAccountId,
        OWNER,
        {},
        adjacentTransactionHashes,
      )(jettonOut);

      expect(items.map(apiTokenView)).toEqual(legacy.map(tokenView));
    });

    it("marks an aborted transfer failed, where the legacy bridge never does", async () => {
      const aborted = { ...jettonIn, transaction_aborted: true };
      serve({ transfers: [aborted], traces: [jettonInTrace] });

      const { items } = await listOperations(context, OWNER, { minHeight: 0 });
      const legacy = await mapJettonTxToOps(mockAccountId, OWNER, {})(aborted);

      expect(legacy[0].hasFailed).toBe(false);
      expect(items[0].tx.failed).toBe(true);
    });
  });
});
