import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { EtherscanOperation, LedgerExplorerOperation } from "@ledgerhq/coin-evm/types/index";
import { createServer } from "node:http";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import {
  initMswHandlers,
  resetIndexer,
  _seedEtherscanOperations,
  _seedLedgerOperations,
} from "./indexer";

const currencyConfig = {
  status: {
    type: "active",
  },
  node: {
    type: "external",
    uri: "http://127.0.0.1:8545",
  },
  explorer: {
    type: "none",
  },
  showNfts: false,
} satisfies EvmConfigInfo;

const etherscanConfig = {
  ...currencyConfig,
  explorer: {
    type: "etherscan",
    uri: "https://coin-tester.invalid/api",
  },
} satisfies EvmConfigInfo;

const ledgerExplorerConfig = {
  ...currencyConfig,
  explorer: {
    type: "ledger",
    explorerId: "eth",
  },
} satisfies EvmConfigInfo;

const makeEtherscanOp = (
  overrides: Partial<EtherscanOperation> & { hash: string; blockNumber: string },
): EtherscanOperation => ({
  timeStamp: "0",
  nonce: "0",
  blockHash: "0x",
  transactionIndex: "0",
  from: "0xAddr",
  to: "0x2",
  value: "0",
  gas: "21000",
  gasPrice: "1000000000",
  isError: "0",
  txreceipt_status: "1",
  contractAddress: "",
  cumulativeGasUsed: "21000",
  gasUsed: "21000",
  confirmations: "1",
  methodId: "0x",
  functionName: "",
  ...overrides,
});

const makeLedgerOp = (
  overrides: Partial<LedgerExplorerOperation> & {
    hash: string;
    block: LedgerExplorerOperation["block"];
  },
): LedgerExplorerOperation => ({
  transaction_type: 0,
  nonce: "0",
  nonce_value: 0,
  value: "0",
  gas: "21000",
  gas_price: "1000000000",
  max_fee_per_gas: null,
  max_priority_fee_per_gas: null,
  from: "0xAddr",
  to: "0x2",
  transfer_events: [],
  erc721_transfer_events: [],
  erc1155_transfer_events: [],
  approval_events: [],
  actions: [],
  confirmations: 1,
  input: null,
  gas_used: "21000",
  cumulative_gas_used: "21000",
  status: 1,
  received_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const startLocalServer = async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Local test server did not expose a TCP port");
  }

  return {
    url: `http://127.0.0.1:${address.port}/health`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
};

const requestThroughHttp = (url: string) =>
  new Promise<string>((resolve, reject) => {
    const request = httpGet(url, response => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", chunk => {
        body += chunk;
      });
      response.on("end", () => {
        resolve(body);
      });
    });

    request.on("error", reject);
  });

const requestThroughHttps = (url: string) =>
  new Promise<string>((resolve, reject) => {
    const request = httpsGet(url, response => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", chunk => {
        body += chunk;
      });
      response.on("end", () => {
        resolve(body);
      });
    });

    request.on("error", reject);
  });

const fetchHttpsJson = async (url: string) => JSON.parse(await requestThroughHttps(url));
const fetchHttpJson = async (url: string) => JSON.parse(await requestThroughHttp(url));

describe("initMswHandlers", () => {
  afterEach(() => {
    resetIndexer();
  });

  it("serves etherscan-like explorer requests without leaving the process", async () => {
    initMswHandlers(etherscanConfig);

    await expect(
      fetchHttpsJson("https://coin-tester.invalid/api?module=account&action=txlist&address=0x1"),
    ).resolves.toEqual({ status: "1", message: "OK", result: [] });
  });

  it("serves ledger explorer requests without leaving the process", async () => {
    initMswHandlers(ledgerExplorerConfig);

    await expect(
      fetchHttpsJson("https://explorers.api.live.ledger.com/blockchain/v4/eth/address/0x1/txs"),
    ).resolves.toEqual({ data: [], token: null });
  });

  it("allows local requests to bypass msw", async () => {
    initMswHandlers(currencyConfig);
    const localServer = await startLocalServer();

    await expect(fetchHttpJson(localServer.url)).resolves.toEqual({ ok: true });

    await localServer.close();
  });

  describe("etherscan-like: filtering, sorting, pagination", () => {
    const addr = "0xAddr";

    beforeEach(() => {
      initMswHandlers(etherscanConfig);
      _seedEtherscanOperations(addr, [
        makeEtherscanOp({ hash: "0xa", blockNumber: "10" }),
        makeEtherscanOp({ hash: "0xb", blockNumber: "20" }),
        makeEtherscanOp({ hash: "0xc", blockNumber: "30" }),
        makeEtherscanOp({ hash: "0xd", blockNumber: "40" }),
        makeEtherscanOp({ hash: "0xe", blockNumber: "50" }),
      ]);
    });

    it.each<{
      description: string;
      querySuffix: string;
      pick: "hash" | "blockNumber";
      expected: string[];
    }>([
      {
        description: "filters by startblock and endblock",
        querySuffix: "&startblock=15&endblock=35",
        pick: "hash",
        expected: ["0xb", "0xc"],
      },
      {
        description: "sorts ascending by default",
        querySuffix: "",
        pick: "blockNumber",
        expected: ["10", "20", "30", "40", "50"],
      },
      {
        description: "sorts descending when sort=desc",
        querySuffix: "&sort=desc",
        pick: "blockNumber",
        expected: ["50", "40", "30", "20", "10"],
      },
    ])("etherscan: $description", async ({ querySuffix, pick, expected }) => {
      const url = `https://coin-tester.invalid/api?module=account&action=txlist&address=${addr}${querySuffix}`;
      const res = await fetchHttpsJson(url);
      const values = res.result.map((op: EtherscanOperation) => op[pick]);
      expect(values).toEqual(expected);
    });

    it("paginates with page and offset", async () => {
      const base = `https://coin-tester.invalid/api?module=account&action=txlist&address=${addr}&offset=2`;

      const page1 = await fetchHttpsJson(`${base}&page=1`);
      expect(page1.result.map((op: EtherscanOperation) => op.hash)).toEqual(["0xa", "0xb"]);

      const page2 = await fetchHttpsJson(`${base}&page=2`);
      expect(page2.result.map((op: EtherscanOperation) => op.hash)).toEqual(["0xc", "0xd"]);

      const page3 = await fetchHttpsJson(`${base}&page=3`);
      expect(page3.result.map((op: EtherscanOperation) => op.hash)).toEqual(["0xe"]);
    });

    it("combines startblock, endblock, sort and pagination", async () => {
      const url = `https://coin-tester.invalid/api?module=account&action=txlist&address=${addr}&startblock=10&endblock=40&sort=desc&offset=2&page=1`;
      const res = await fetchHttpsJson(url);
      const hashes = res.result.map((op: EtherscanOperation) => op.hash);
      expect(hashes).toEqual(["0xd", "0xc"]);
    });
  });

  describe("ledger explorer: filtering, sorting, pagination", () => {
    const addr = "0xAddr";

    beforeEach(() => {
      initMswHandlers(ledgerExplorerConfig);
      _seedLedgerOperations(addr, [
        makeLedgerOp({
          hash: "0xa",
          block: { hash: "0x", height: 10, time: "2024-01-01T00:00:10.000Z" },
        }),
        makeLedgerOp({
          hash: "0xb",
          block: { hash: "0x", height: 20, time: "2024-01-01T00:00:20.000Z" },
        }),
        makeLedgerOp({
          hash: "0xc",
          block: { hash: "0x", height: 30, time: "2024-01-01T00:00:30.000Z" },
        }),
        makeLedgerOp({
          hash: "0xd",
          block: { hash: "0x", height: 40, time: "2024-01-01T00:00:40.000Z" },
        }),
        makeLedgerOp({
          hash: "0xe",
          block: { hash: "0x", height: 50, time: "2024-01-01T00:00:50.000Z" },
        }),
      ]);
    });

    it.each([
      {
        description: "filters by from_height",
        query: "?from_height=25",
        assert: (ops: LedgerExplorerOperation[]) => {
          expect(ops.map(o => o.hash)).toEqual(["0xc", "0xd", "0xe"]);
        },
      },
      {
        description: "sorts ascending by default",
        query: "",
        assert: (ops: LedgerExplorerOperation[]) => {
          expect(ops.map(o => o.block.height)).toEqual([10, 20, 30, 40, 50]);
        },
      },
      {
        description: "sorts descending when order=descending",
        query: "?order=descending",
        assert: (ops: LedgerExplorerOperation[]) => {
          expect(ops.map(o => o.block.height)).toEqual([50, 40, 30, 20, 10]);
        },
      },
    ])("ledger: $description", async ({ query, assert }) => {
      const url = `https://explorers.api.live.ledger.com/blockchain/v4/eth/address/${addr}/txs${query}`;
      const res = await fetchHttpsJson(url);
      assert(res.data);
    });

    it("paginates with batch_size and returns cursor token", async () => {
      const base = `https://explorers.api.live.ledger.com/blockchain/v4/eth/address/${addr}/txs?batch_size=2`;

      const page1 = await fetchHttpsJson(base);
      expect(page1.data.map((op: LedgerExplorerOperation) => op.hash)).toEqual(["0xa", "0xb"]);
      expect(page1.token).toBe("2");

      const page2 = await fetchHttpsJson(`${base}&token=${page1.token}`);
      expect(page2.data.map((op: LedgerExplorerOperation) => op.hash)).toEqual(["0xc", "0xd"]);
      expect(page2.token).toBe("4");

      const page3 = await fetchHttpsJson(`${base}&token=${page2.token}`);
      expect(page3.data.map((op: LedgerExplorerOperation) => op.hash)).toEqual(["0xe"]);
      expect(page3.token).toBeNull();
    });

    it("combines from_height and batch_size", async () => {
      const url = `https://explorers.api.live.ledger.com/blockchain/v4/eth/address/${addr}/txs?from_height=20&batch_size=2&order=ascending`;
      const res = await fetchHttpsJson(url);
      const hashes = res.data.map((op: LedgerExplorerOperation) => op.hash);
      expect(hashes).toEqual(["0xb", "0xc"]);
      expect(res.token).toBe("2");
    });
  });
});
