import type { Logger } from "@ledgerhq/coin-module-framework/config";
import network from "@ledgerhq/live-network";
import type { TronCoinConfig } from "../config";
import { decode58Check } from "../network/format";
import * as trxSwap from "./__fixtures__/trxSwap88336767";
import { listOperations } from "./listOperations";

// Only HTTP is faked: the TronGrid responses go through the real network layer and adapters.
jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = network as jest.MockedFunction<typeof network>;
const logger: Logger = jest.fn();
const config = {
  status: { type: "active" },
  explorer: { url: "https://tron-test.example.com" },
} as TronCoinConfig;
const options = { limit: 50, minTimestamp: 0, order: "desc" as const };

type Request = { url: string; data?: { id_or_num?: string } };
type Pages = { native?: unknown; trc20?: unknown };

const respond = (body: unknown) => ({ data: body, status: 200 });
const page = (data: unknown[]) => ({
  data,
  success: true,
  meta: { at: 0, page_size: data.length },
});
const emptyPage = page([]);

function serve({ native = emptyPage, trc20 = emptyPage }: Pages, block?: unknown) {
  mockedNetwork.mockImplementation((async ({ url, data }: Request) => {
    if (url.includes("/transactions/trc20?")) return respond(trc20);
    if (url.includes("/transactions?")) return respond(native);
    if (url.includes("/internal-transactions?")) return respond(emptyPage);
    if (url.endsWith("/wallet/getblock")) {
      const height = Number(data?.id_or_num);
      return respond(
        block ?? {
          blockID: `block-${height}`,
          block_header: { raw_data: { number: height, timestamp: 1778242722000 } },
        },
      );
    }
    throw new Error(`unexpected request ${url}`);
  }) as never);
}

describe("listOperations — value attached to a smart contract call", () => {
  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  it("lists the TRX a recorded TRX -> USDT swap paid, next to the USDT it received", async () => {
    serve({ native: trxSwap.nativePage, trc20: trxSwap.trc20Page }, trxSwap.blockHeader);

    const { items } = await listOperations(logger, config, trxSwap.account, options);

    expect(
      items.map(op => ({
        id: op.id,
        type: op.type,
        value: op.value,
        asset: op.asset.type,
        recipients: op.recipients,
        fees: op.tx.fees,
      })),
    ).toEqual([
      {
        id: `${trxSwap.txID}-call-value`,
        type: "OUT",
        value: 9_500_000_000n,
        asset: "native",
        recipients: [trxSwap.router],
        fees: 0n,
      },
      {
        id: trxSwap.txID,
        type: "IN",
        value: 2_881_673_945n,
        asset: "trc20",
        recipients: [trxSwap.account],
        fees: 513_000n,
      },
    ]);
  });

  describe("synthetic records", () => {
    const account = "TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a";
    const accountHex = decode58Check(account);
    const contract = "TTtiUacDYFYVuWp57DnvJPsUsfiQV73Hxi";
    const contractHex = decode58Check(contract);
    const otherHex = "419fb257078170a17a0500189d80031ac9a3fba6be";
    const usdt = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const ts = 1778242722000;

    const call = (callValue: Record<string, number> = {}, ownerHex = accountHex) => ({
      ret: [{ contractRet: "SUCCESS", fee: 1000 }],
      txID: "tx1",
      blockNumber: 100,
      block_timestamp: ts,
      raw_data: {
        contract: [
          {
            type: "TriggerSmartContract",
            parameter: {
              value: {
                owner_address: ownerHex,
                contract_address: contractHex,
                data: "224ee04f",
                ...callValue,
              },
            },
          },
        ],
      },
      internal_transactions: [],
    });
    const trc20Record = {
      transaction_id: "tx1",
      token_info: { address: usdt, symbol: "USDT", decimals: 6, name: "Tether USD" },
      block_timestamp: ts,
      from: contract,
      to: account,
      type: "Transfer",
      value: "5000000",
      detail: {
        ret: [{ contractRet: "SUCCESS", fee: 1000 }],
        blockNumber: 100,
        raw_data: {
          contract: [
            {
              type: "TriggerSmartContract",
              parameter: { value: { owner_address: accountHex, contract_address: contractHex } },
            },
          ],
        },
      },
    };
    const summary = async () =>
      (await listOperations(logger, config, account, options)).items.map(op => [
        op.id,
        op.type,
        op.value,
        op.asset,
        op.tx.fees,
      ]);

    it("lists a call with no TRC20 transfer as an OUT of its TRX, with the fee", async () => {
      serve({ native: page([call({ call_value: 700 })]) });

      expect(await summary()).toEqual([["tx1", "OUT", 700n, { type: "native" }, 1000n]]);
    });

    it("lists a call that attaches nothing for its fee", async () => {
      serve({ native: page([call()]) });

      expect(await summary()).toEqual([["tx1", "OUT", 0n, { type: "native" }, 1000n]]);
    });

    it("lists only the TRC20 transfer of a call that attaches nothing", async () => {
      serve({ native: page([call()]), trc20: page([trc20Record]) });

      expect(await summary()).toEqual([
        [
          "tx1",
          "IN",
          5_000_000n,
          { type: "trc20", assetReference: usdt, assetOwner: account },
          1000n,
        ],
      ]);
    });

    it("lists the TRC10 a call attaches as an operation of its own", async () => {
      serve({ native: page([call({ call_token_value: 42, token_id: 1002000 })]) });

      expect(await summary()).toEqual([
        ["tx1", "OUT", 0n, { type: "native" }, 1000n],
        [
          "tx1-call-token-value",
          "OUT",
          42n,
          { type: "trc10", assetReference: "1002000", assetOwner: account },
          0n,
        ],
      ]);
    });

    it("does not list a call the account neither sent nor received", async () => {
      serve({ native: page([call({ call_value: 700 }, otherHex)]) });

      expect(await summary()).toEqual([]);
    });
  });
});
