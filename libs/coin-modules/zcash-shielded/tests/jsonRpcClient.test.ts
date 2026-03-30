import { JsonRpcClient } from "../src/jsonRpcClient";
import { blockWithMyTx, LAST_BLOCK_COUNT, txNotShielded } from "./testAccounts";
import { server } from "./mocks/node";
import { HttpResponse, http } from "msw";
import { ZCASH_JSON_RPC_SERVER_TESTNET } from "../src/constants";

beforeAll(() =>
  server.listen({
    onUnhandledRequest: "error",
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("jsonRpcClient", () => {
  describe("getBlock", () => {
    test("successfully fetches a block from the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const block = await jsonRpcClient.getBlock(blockWithMyTx.hash);
      expect(block).toMatchObject(blockWithMyTx);
    });

    test("fails to fetch a block not in the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const block = await jsonRpcClient.getBlock(blockWithMyTx.hash + 1);
      expect(block).toEqual(undefined);
    });
  });

  describe("getRawTransaction", () => {
    test("successfully fetches a raw transaction from the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const tx = await jsonRpcClient.getRawTransaction(txNotShielded.txid);
      expect(tx).toMatchObject(txNotShielded);
    });

    test("fails to fetch a transaction not in the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const block = await jsonRpcClient.getRawTransaction(txNotShielded.txid + 1);
      expect(block).toEqual(undefined);
    });
  });

  describe("server error", () => {
    test("rethrows on server errors", async () => {
      server.use(http.post(ZCASH_JSON_RPC_SERVER_TESTNET, () => new HttpResponse(null, { status: 500 })));
      const jsonRpcClient = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);

      try {
        await jsonRpcClient.getRawTransaction(txNotShielded.txid);
      } catch (error) {
        expect(error.message).toMatch(/^API HTTP 500 /);
      }

      expect.assertions(1);
    });
  });

  describe("network error", () => {
    test("throws on network errors", async () => {
      server.use(http.post(ZCASH_JSON_RPC_SERVER_TESTNET, () => HttpResponse.error()));
      const jsonRpcClient = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);

      try {
        await jsonRpcClient.getRawTransaction(txNotShielded.txid);
      } catch (error) {
        expect(error.message).toEqual("Network error");
      }
    });
  });

  describe("getBlockCount", () => {
    test("successfully fetches the last block count from the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const block = await jsonRpcClient.getBlockCount();
      expect(block).toEqual(LAST_BLOCK_COUNT);
    });

    test("returns block count when network returns numeric result", async () => {
      server.use(
        http.post(ZCASH_JSON_RPC_SERVER_TESTNET, async ({ request }) => {
          const body = await request.clone().json();
          if (
            body &&
            typeof body === "object" &&
            "method" in body &&
            body.method === "getblockcount"
          ) {
            return HttpResponse.json({ result: 42 });
          }
        }),
      );
      const client = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const count = await client.getBlockCount();
      expect(count).toBe(42);
    });

    test("calls network with POST, nodeUrl, getblockcount method and empty params", async () => {
      let capturedBody: unknown;
      server.use(
        http.post(ZCASH_JSON_RPC_SERVER_TESTNET, async ({ request }) => {
          const body = await request.clone().json();
          capturedBody = body;
          return HttpResponse.json({ result: 100 });
        }),
      );
      const client = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      await client.getBlockCount();
      expect(capturedBody).toEqual({
        jsonrpc: "2.0",
        id: 1,
        method: "getblockcount",
        params: [],
      });
    });

    test("returns undefined when RPC returns error", async () => {
      server.use(
        http.post(ZCASH_JSON_RPC_SERVER_TESTNET, () =>
          HttpResponse.json({
            error: { code: -1, message: "node error" },
          }),
        ),
      );
      const client = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const count = await client.getBlockCount();
      expect(count).toBeUndefined();
    });

    test("returns undefined when response has no result", async () => {
      server.use(http.post(ZCASH_JSON_RPC_SERVER_TESTNET, () => HttpResponse.json({})));
      const client = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const count = await client.getBlockCount();
      expect(count).toBeUndefined();
    });

    test("returns undefined when result is not a number (string)", async () => {
      server.use(http.post(ZCASH_JSON_RPC_SERVER_TESTNET, () => HttpResponse.json({ result: "100" })));
      const client = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const count = await client.getBlockCount();
      expect(count).toBeUndefined();
    });

    test("returns undefined when result is not a number (object)", async () => {
      server.use(http.post(ZCASH_JSON_RPC_SERVER_TESTNET, () => HttpResponse.json({ result: {} })));
      const client = new JsonRpcClient(ZCASH_JSON_RPC_SERVER_TESTNET);
      const count = await client.getBlockCount();
      expect(count).toBeUndefined();
    });
  });
});
