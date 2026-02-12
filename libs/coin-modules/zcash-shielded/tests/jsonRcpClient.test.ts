import { JsonRpcClient } from "../src/jsonRpcClient";
import { blockWithMyTx, txNotShielded } from "./testAccounts";
import { server } from "../mocks/node";
import { HttpResponse, http } from "msw";

beforeAll(() =>
  server.listen({
    onUnhandledRequest: "error",
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const JSON_RPC_SERVER = "http://localhost:18232";

describe("rpcClient", () => {
  describe("getBlock", () => {
    test("successfully fetches a block from the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(JSON_RPC_SERVER);
      const block = await jsonRpcClient.getBlock(blockWithMyTx.hash);
      expect(block).toMatchObject(blockWithMyTx);
    });

    test("fails to fetch a block not in the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(JSON_RPC_SERVER);
      const block = await jsonRpcClient.getBlock(blockWithMyTx.hash + 1);
      expect(block).toEqual(undefined);
    });
  });

  describe("getRawTransaction", () => {
    test("successfully fetches a raw transaction from the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(JSON_RPC_SERVER);
      const tx = await jsonRpcClient.getRawTransaction(txNotShielded.txid);
      expect(tx).toMatchObject(txNotShielded);
    });

    test("fails to fetch a transaction not in the blockchain", async () => {
      const jsonRpcClient = new JsonRpcClient(JSON_RPC_SERVER);
      const block = await jsonRpcClient.getRawTransaction(txNotShielded.txid + 1);
      expect(block).toEqual(undefined);
    });
  });

  describe("server error", () => {
    test("rethrows on server errors", async () => {
      server.use(http.post(JSON_RPC_SERVER, () => new HttpResponse(null, { status: 500 })));
      const jsonRpcClient = new JsonRpcClient(JSON_RPC_SERVER);

      try {
        await jsonRpcClient.getRawTransaction(txNotShielded.txid);
      } catch (error) {
        expect(error.message).toMatch(/^API HTTP 500 /);
      }
    });
  });

  describe("network error", () => {
    test("throws on network errors", async () => {
      server.use(http.post(JSON_RPC_SERVER, () => HttpResponse.error()));
      const jsonRpcClient = new JsonRpcClient(JSON_RPC_SERVER);

      try {
        await jsonRpcClient.getRawTransaction(txNotShielded.txid);
      } catch (error) {
        expect(error.message).toEqual("Network error");
      }
    });
  });
});
