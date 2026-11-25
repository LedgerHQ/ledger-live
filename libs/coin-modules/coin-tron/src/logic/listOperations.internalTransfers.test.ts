import type { Logger } from "@ledgerhq/coin-module-framework/config";
import network from "@ledgerhq/live-network";
import type { TronCoinConfig } from "../config";
import { decode58Check } from "../network/format";
import { TronMissingReceipt } from "../types/errors";
import * as payout from "./__fixtures__/contractPayout82524820";
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
  native: unknown;
  trc20: unknown;
  receipts: Record<string, unknown>;
};

function serve({ native, trc20, receipts }: Routes) {
  mockedNetwork.mockImplementation((async ({ url, data }: Request) => {
    if (url.includes("/transactions/trc20?")) return respond(trc20);
    if (url.includes("/transactions?")) return respond(native);
    if (url.endsWith("/wallet/gettransactioninfobyid"))
      return respond(receipts[data?.value ?? ""] ?? {});
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

const receiptRequests = () =>
  mockedNetwork.mock.calls.filter(([{ url }]) => url?.endsWith("/wallet/gettransactioninfobyid"));

const options = { limit: 50, minTimestamp: 0, order: "desc" as const };
const emptyPage = page([]);

describe("listOperations — TRX moved by contracts (internal transactions)", () => {
  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  describe("recorded: a contract paying TRX back to its caller", () => {
    const account = "TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a";
    const contract = "TTtiUacDYFYVuWp57DnvJPsUsfiQV73Hxi";
    const callTxId = payout.receipt.id;

    beforeEach(() => {
      mockedNetwork.mockImplementation((async ({ url }: Request) => {
        if (url.includes("/transactions/trc20?")) return respond(payout.trc20Page);
        if (url.includes("/transactions?")) return respond(payout.nativePage);
        if (url.endsWith("/wallet/gettransactioninfobyid")) return respond(payout.receipt);
        if (url.endsWith("/wallet/getblock")) return respond(payout.block);
        throw new Error(`unexpected request ${url}`);
      }) as never);
    });

    it("lists the TRX the contract paid as an internal IN operation of the call", async () => {
      const { items } = await listOperations(logger, config, account, options);

      expect(items).toEqual([
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

    it("reads the call's receipt once", async () => {
      await listOperations(logger, config, account, options);

      expect(receiptRequests()).toHaveLength(1);
      expect(receiptRequests()[0][0].data).toEqual({ value: callTxId });
    });
  });

  describe("synthetic receipts", () => {
    const account = "TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a";
    const accountHex = decode58Check(account);
    const sender = "TTtiUacDYFYVuWp57DnvJPsUsfiQV73Hxi";
    const senderHex = decode58Check(sender);
    const usdt = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const usdtHex = decode58Check(usdt);
    const contractHex = "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b";
    const otherHex = "419fb257078170a17a0500189d80031ac9a3fba6be";
    const ts = 1778242722000;

    const nativeCall = (txID: string, contractRet = "SUCCESS") => ({
      ret: [{ contractRet, fee: 1000 }],
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

    it("lists TRX paid by a third party's call that TronGrid only lists as a TRC20 transfer", async () => {
      serve({
        native: emptyPage,
        trc20: page([trc20Record("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [internalTx(contractHex, accountHex, [{ callValue: 700 }])]),
        },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items.map(op => [op.id, op.type, op.value, op.asset])).toEqual([
        ["tx1", "IN", 5_000_000n, { type: "trc20", assetReference: usdt, assetOwner: account }],
        ["tx1-internal-0", "IN", 700n, { type: "native" }],
      ]);
      const internal = items[1];
      expect(internal.tx.fees).toBe(0n);
      expect(internal.tx.feesPayer).toBe(sender);
      expect(internal.details).toEqual({ internal: true });
    });

    it("lists a TRC10 internal transfer with its TRC10 asset", async () => {
      serve({
        native: page([nativeCall("tx1")]),
        trc20: emptyPage,
        receipts: {
          tx1: receiptOf("tx1", [
            internalTx(contractHex, accountHex, [{ callValue: 42, tokenId: "1002000" }]),
          ]),
        },
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
    });

    it("lists an internal transfer sent by the account as OUT", async () => {
      serve({
        native: page([nativeCall("tx1")]),
        trc20: emptyPage,
        receipts: {
          tx1: receiptOf("tx1", [internalTx(accountHex, otherHex, [{ callValue: 9 }])]),
        },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items.map(op => [op.id, op.type, op.value])).toEqual([["tx1-internal-0", "OUT", 9n]]);
    });

    it("ignores rejected, zero-value and other accounts' internal transfers", async () => {
      serve({
        native: page([nativeCall("tx1")]),
        trc20: emptyPage,
        receipts: {
          tx1: receiptOf("tx1", [
            internalTx(contractHex, accountHex, [{ callValue: 1 }], { rejected: true }),
            internalTx(contractHex, accountHex, [{}]),
            internalTx(contractHex, accountHex, [{ callValue: 0 }]),
            internalTx(contractHex, otherHex, [{ callValue: 5 }]),
            internalTx(contractHex, accountHex, [{ callValue: 3 }]),
          ]),
        },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(items.map(op => [op.id, op.value])).toEqual([["tx1-internal-4", 3n]]);
    });

    it("does not read the receipt of a failed call, whose revert undoes its internal transfers", async () => {
      serve({ native: page([nativeCall("tx1", "REVERT")]), trc20: emptyPage, receipts: {} });

      const { items } = await listOperations(logger, config, account, options);

      expect(receiptRequests()).toHaveLength(0);
      expect(items.map(op => [op.id, op.tx.failed])).toEqual([["tx1", true]]);
    });

    it("reads one receipt for a call listed by both endpoints", async () => {
      serve({
        native: page([nativeCall("tx1")]),
        trc20: page([trc20Record("tx1")]),
        receipts: {
          tx1: receiptOf("tx1", [internalTx(contractHex, accountHex, [{ callValue: 700 }])]),
        },
      });

      const { items } = await listOperations(logger, config, account, options);

      expect(receiptRequests()).toHaveLength(1);
      expect(items.map(op => op.id)).toEqual(["tx1", "tx1-internal-0"]);
    });

    it("fails the page with TronMissingReceipt when the node has no receipt for a listed call", async () => {
      serve({ native: page([nativeCall("tx1")]), trc20: emptyPage, receipts: {} });

      await expect(listOperations(logger, config, account, options)).rejects.toThrow(
        TronMissingReceipt,
      );
    });
  });
});
