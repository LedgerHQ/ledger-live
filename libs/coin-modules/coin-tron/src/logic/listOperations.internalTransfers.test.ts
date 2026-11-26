import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import network from "@ledgerhq/live-network";
import type { TronCoinConfig } from "../config";
import { decode58Check, encode58Check } from "../network/format";
import { TronMissingReceipt } from "../types/errors";
import * as payout from "./__fixtures__/contractPayout82524820";
import * as selfdestruct from "./__fixtures__/selfdestructPayouts";
import { listOperations } from "./listOperations";

// Only HTTP is faked: the TronGrid responses go through the real network layer and adapters.
jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = network as jest.MockedFunction<typeof network>;
const logger: Logger = jest.fn();
const config = {
  status: { type: "active" },
  explorer: { url: "https://tron-test.example.com" },
} as TronCoinConfig;

type Request = { url: string; data?: { value?: string; id_or_num?: string } };

const respond = (body: unknown) => ({ data: body, status: 200 });
const page = (data: unknown[]) => ({
  data,
  success: true,
  meta: { at: 0, page_size: data.length },
});
const receiptOf = (txID: string, internal_transactions: unknown[]) => ({
  id: txID,
  blockNumber: 100,
  internal_transactions,
});
const internalTx = (
  from: string,
  to: string,
  callValueInfo: unknown[],
  extra: { rejected?: boolean } = {},
) => ({
  hash: "internal",
  caller_address: from,
  transferTo_address: to,
  callValueInfo,
  note: "63616c6c",
  ...extra,
});

type Routes = {
  native?: unknown;
  trc20?: unknown;
  internal?: unknown;
  receipts?: Record<string, unknown>;
  transactions?: Record<string, unknown>;
};

function serve({ native, trc20, internal, receipts = {}, transactions = {} }: Routes) {
  mockedNetwork.mockImplementation((async ({ url, data }: Request) => {
    if (url.includes("/transactions/trc20?")) return respond(trc20 ?? emptyPage);
    if (url.includes("/transactions?")) return respond(native ?? emptyPage);
    if (url.includes("/internal-transactions?")) return respond(internal ?? emptyPage);
    if (url.endsWith("/wallet/gettransactioninfobyid"))
      return respond(receipts[data?.value ?? ""] ?? {});
    if (url.endsWith("/wallet/gettransactionbyid"))
      return respond(transactions[data?.value ?? ""] ?? {});
    if (url.endsWith("/wallet/getblock")) {
      const height = Number(data?.id_or_num);
      return respond({
        blockID: `block-${height}`,
        block_header: { raw_data: { number: height, timestamp: 1778242722000 } },
      });
    }
    throw new Error(`unexpected request ${url}`);
  }) as never);
}

const requestsTo = (endpoint: string) =>
  mockedNetwork.mock.calls.filter(([{ url }]) => url?.endsWith(endpoint));
const receiptRequests = () => requestsTo("/wallet/gettransactioninfobyid");

const options = { limit: 50, minTimestamp: 0, order: "desc" as const };
const emptyPage = page([]);

async function walkHistory(account: string): Promise<Operation[]> {
  const operations: Operation[] = [];
  let cursor: string | undefined;
  do {
    const result = await listOperations(logger, config, account, { ...options, cursor });
    operations.push(...result.items);
    cursor = result.next;
  } while (cursor);
  return operations;
}

/** What the operations add up to in TRX: amounts moved, less the fees the account paid. */
function nativeBalanceOf(operations: Operation[], address: string): bigint {
  const feesPaidByTx = new Map<string, bigint>();
  let moved = 0n;
  for (const { type, value, asset, tx } of operations) {
    // A transaction's fee is on one of its operations; the others, internal ones included, carry 0.
    if (tx.feesPayer === address && tx.fees > 0n) feesPaidByTx.set(tx.hash, tx.fees);
    if (asset.type !== "native" || tx.failed) continue;
    if (type === "IN") moved += value;
    if (type === "OUT") moved -= value;
  }
  return [...feesPaidByTx.values()].reduce((balance, fees) => balance - fees, moved);
}

describe("listOperations — value moved by contracts (internal transactions)", () => {
  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  describe("recorded: contracts destroyed with the account as beneficiary (BACK-11812)", () => {
    beforeEach(() => {
      mockedNetwork.mockImplementation((async ({ url, data }: Request) => {
        const path = url.replace(config.explorer.url, "");
        const exchange = selfdestruct.exchanges.find(
          recorded =>
            recorded.url === path && JSON.stringify(recorded.data) === JSON.stringify(data),
        );
        if (!exchange) throw new Error(`unrecorded request ${path} ${JSON.stringify(data)}`);
        return respond(exchange.body);
      }) as never);
    });

    it("lists every TRX payout of the destroyed contracts as an internal IN operation", async () => {
      const internal = (await walkHistory(selfdestruct.address)).filter(op => op.details?.internal);

      expect(internal).toHaveLength(12);
      expect(internal.every(op => op.type === "IN" && op.tx.fees === 0n)).toBe(true);
      expect(internal.reduce((total, op) => total + op.value, 0n)).toBe(4_104_742_878n);
    });

    it("gives operations whose TRX amounts and fees add up to the account's balance", async () => {
      const operations = await walkHistory(selfdestruct.address);

      expect(nativeBalanceOf(operations, selfdestruct.address)).toBe(selfdestruct.balance);
    });
  });

  describe("recorded: a contract paying TRX back to its caller", () => {
    const account = "TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a";
    const contract = "TTtiUacDYFYVuWp57DnvJPsUsfiQV73Hxi";
    const callTxId = payout.receipt.id;

    beforeEach(() => {
      mockedNetwork.mockImplementation((async ({ url }: Request) => {
        if (url.includes("/transactions/trc20?")) return respond(payout.trc20Page);
        if (url.includes("/transactions?")) return respond(payout.nativePage);
        if (url.includes("/internal-transactions?")) return respond(payout.internalPage);
        if (url.endsWith("/wallet/gettransactioninfobyid")) return respond(payout.receipt);
        if (url.endsWith("/wallet/gettransactionbyid")) return respond(payout.transaction);
        if (url.endsWith("/wallet/getblock")) return respond(payout.block);
        throw new Error(`unexpected request ${url}`);
      }) as never);
    });

    it("lists the call with its fee, then the TRX the contract paid as an internal IN", async () => {
      const { items } = await listOperations(logger, config, account, options);
      const block = {
        height: 82524820,
        hash: payout.block.blockID,
        time: new Date(payout.block.block_header.raw_data.timestamp),
      };

      expect(items).toEqual([
        {
          id: callTxId,
          type: "OUT",
          value: 0n,
          asset: { type: "native" },
          senders: [account],
          recipients: [contract],
          tx: {
            hash: callTxId,
            block,
            fees: 990_300n,
            feesPayer: account,
            date: new Date(1778242722000),
            failed: false,
          },
        },
        {
          id: `${callTxId}-internal-3`,
          type: "IN",
          value: 6_471_728_420n,
          asset: { type: "native" },
          senders: [contract],
          recipients: [account],
          tx: {
            hash: callTxId,
            block: {
              height: 82524820,
              hash: payout.block.blockID,
              time: new Date(payout.block.block_header.raw_data.timestamp),
            },
            fees: 0n,
            feesPayer: account,
            date: new Date(1778242722000),
            failed: false,
          },
          details: { internal: true },
        },
      ]);
    });

    it("reads the call's receipt and transaction once", async () => {
      await listOperations(logger, config, account, options);

      expect(receiptRequests().map(([{ data }]) => data)).toEqual([{ value: callTxId }]);
      expect(requestsTo("/wallet/gettransactionbyid").map(([{ data }]) => data)).toEqual([
        { value: callTxId },
      ]);
    });
  });

  describe("synthetic responses", () => {
    const account = "TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a";
    const accountHex = decode58Check(account);
    const sender = "TTtiUacDYFYVuWp57DnvJPsUsfiQV73Hxi";
    const senderHex = decode58Check(sender);
    const usdt = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const usdtHex = decode58Check(usdt);
    const contractHex = "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b";
    const otherHex = "419fb257078170a17a0500189d80031ac9a3fba6be";
    const ts = 1778242722000;

    const internalRecord = (txID: string, extra: { rejected?: boolean } = {}) => ({
      internal_tx_id: `${txID}-record`,
      tx_id: txID,
      from_address: contractHex,
      to_address: accountHex,
      block_timestamp: ts,
      data: { note: "call", rejected: false, ...extra },
    });
    const transactionOf = (txID: string, ownerHex = senderHex, contractRet = "SUCCESS") => ({
      txID,
      ret: [{ contractRet }],
      raw_data: {
        contract: [
          {
            type: "TriggerSmartContract",
            parameter: { value: { owner_address: ownerHex, contract_address: contractHex } },
          },
        ],
      },
    });
    const nativeCall = (txID: string) => ({
      ret: [{ contractRet: "SUCCESS", fee: 1000 }],
      txID,
      blockNumber: 100,
      block_timestamp: ts,
      raw_data: {
        contract: [
          {
            type: "TriggerSmartContract",
            parameter: {
              value: { owner_address: accountHex, contract_address: contractHex, data: "224ee04f" },
            },
          },
        ],
      },
      internal_transactions: [],
    });
    const trc20Record = (txID: string) => ({
      transaction_id: txID,
      token_info: { address: usdt, symbol: "USDT", decimals: 6, name: "Tether USD" },
      block_timestamp: ts,
      from: sender,
      to: account,
      type: "Transfer",
      value: "5000000",
      detail: {
        ret: [{ contractRet: "SUCCESS", fee: 2000 }],
        blockNumber: 100,
        raw_data: {
          contract: [
            {
              type: "TriggerSmartContract",
              parameter: {
                value: { owner_address: senderHex, contract_address: usdtHex, data: "a9059cbb" },
              },
            },
          ],
        },
      },
    });

    it("lists TRX paid by a transaction only the internal-transactions endpoint lists", async () => {
      serve({
        internal: page([internalRecord("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [internalTx(contractHex, accountHex, [{ callValue: 700 }])]),
        },
        transactions: { tx1: transactionOf("tx1") },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items).toEqual([
        expect.objectContaining({
          id: "tx1-internal-0",
          type: "IN",
          value: 700n,
          asset: { type: "native" },
          senders: [encode58Check(contractHex)],
          recipients: [account],
          details: { internal: true },
        }),
      ]);
      expect(items[0].tx).toMatchObject({ hash: "tx1", fees: 0n, feesPayer: sender });
    });

    it("lists TRX a TRC20 transfer also paid, next to the transfer", async () => {
      serve({
        trc20: page([trc20Record("tx1")]),
        internal: page([internalRecord("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [internalTx(contractHex, accountHex, [{ callValue: 700 }])]),
        },
        transactions: { tx1: transactionOf("tx1") },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items.map(op => [op.id, op.type, op.value, op.asset])).toEqual([
        ["tx1", "IN", 5_000_000n, { type: "trc20", assetReference: usdt, assetOwner: account }],
        ["tx1-internal-0", "IN", 700n, { type: "native" }],
      ]);
    });

    it("lists a TRC10 internal transfer as a plain operation of its TRC10 asset", async () => {
      serve({
        internal: page([internalRecord("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [
            internalTx(contractHex, accountHex, [{ callValue: 42, tokenId: "1002000" }]),
          ]),
        },
        transactions: { tx1: transactionOf("tx1") },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items.map(op => [op.id, op.type, op.value, op.asset])).toEqual([
        [
          "tx1-internal-0",
          "IN",
          42n,
          { type: "trc10", assetReference: "1002000", assetOwner: account },
        ],
      ]);
      // Not `internal`: consumers would count it in the native balance.
      expect(items[0].details).toEqual({ ledgerOpType: "IN" });
    });

    it("lists an internal transfer sent by the account as OUT", async () => {
      serve({
        internal: page([internalRecord("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [internalTx(accountHex, otherHex, [{ callValue: 9 }])]),
        },
        transactions: { tx1: transactionOf("tx1", accountHex) },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items.map(op => [op.id, op.type, op.value, op.tx.feesPayer])).toEqual([
        ["tx1-internal-0", "OUT", 9n, account],
      ]);
    });

    it("ignores rejected, zero-value and other accounts' internal transfers", async () => {
      serve({
        internal: page([internalRecord("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [
            internalTx(contractHex, accountHex, [{ callValue: 1 }], { rejected: true }),
            internalTx(contractHex, accountHex, [{}]),
            internalTx(contractHex, accountHex, [{ callValue: 0 }]),
            internalTx(contractHex, otherHex, [{ callValue: 5 }]),
            internalTx(contractHex, accountHex, [{ callValue: 3 }]),
          ]),
        },
        transactions: { tx1: transactionOf("tx1") },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items.map(op => [op.id, op.value])).toEqual([["tx1-internal-4", 3n]]);
    });

    it("lists nothing a failed transaction's contracts moved, which its revert undid", async () => {
      serve({
        internal: page([internalRecord("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [internalTx(contractHex, accountHex, [{ callValue: 700 }])]),
        },
        transactions: { tx1: transactionOf("tx1", senderHex, "REVERT") },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items).toEqual([]);
    });

    it("reads nothing for a record the endpoint marks rejected", async () => {
      serve({ internal: page([internalRecord("tx1", { rejected: true })]) });

      const { items } = await listOperations(logger, config, account, options);

      expect(items).toEqual([]);
      expect(receiptRequests()).toHaveLength(0);
    });

    it("reads a transaction once, however many records list it", async () => {
      serve({
        native: page([nativeCall("tx1")]),
        internal: page([internalRecord("tx1"), internalRecord("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [
            internalTx(contractHex, accountHex, [{ callValue: 700 }]),
            internalTx(contractHex, accountHex, [{ callValue: 800 }]),
          ]),
        },
        transactions: { tx1: transactionOf("tx1", accountHex) },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(receiptRequests()).toHaveLength(1);
      expect(requestsTo("/wallet/gettransactionbyid")).toHaveLength(1);
      expect(items.map(op => op.id)).toEqual(["tx1", "tx1-internal-0", "tx1-internal-1"]);
    });

    it("fails the page with TronMissingReceipt when the node does not know the transaction yet", async () => {
      serve({ internal: page([internalRecord("tx1")]) });

      await expect(listOperations(logger, config, account, options)).rejects.toThrow(
        TronMissingReceipt,
      );
    });
  });
});
