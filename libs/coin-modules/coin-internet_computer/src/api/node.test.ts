import { Cbor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { IcpContext, IcpCurrencyConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { getBlockInfo } from "../logic/getBlockInfo";
import type { IcpIntent } from "../logic/intent";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntentWithStakeAccount } from "../logic/validateIntent";
import { getCanisterIdlFunc, indexIdlFactory } from "../network/candid";
import { createApi } from "./index";

jest.mock("../logic/broadcast");
jest.mock("../logic/getBlockInfo");
jest.mock("../logic/lastBlock");
jest.mock("../logic/listOperations");
jest.mock("../logic/validateIntent");

// The node signatures of a query reply cannot come from a test key, so the agent skips them.
jest.mock("../network/agent", () => ({
  getAgent: (host: string) => HttpAgent.create({ host, verifyQuerySignatures: false }),
}));

const LOCAL_NODE = "http://127.0.0.1:4943";
const ADDRESS = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const balanceFunc = getCanisterIdlFunc(indexIdlFactory, "get_account_identifier_balance");

const contextWith = (fields: Partial<IcpCurrencyConfig>): IcpContext =>
  ({ config: async () => fields, logger: () => {} }) as unknown as IcpContext;

/** The origin of each query the nodes received. */
let queried: string[];

const server = setupServer(
  http.post("*/api/:version/canister/:canisterId/query", ({ request }) => {
    queried.push(new URL(request.url).origin);
    return new HttpResponse(
      Buffer.from(
        Cbor.encode({
          status: "replied",
          reply: { arg: new Uint8Array(IDL.encode(balanceFunc.retTypes, [5n])) },
        }),
      ),
      { headers: { "Content-Type": "application/cbor" } },
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  queried = [];
  jest.clearAllMocks();
});

describe("createApi node", () => {
  const api = createApi();

  it("queries the node the config names", async () => {
    const balances = await api.getBalance(contextWith({ node: { url: LOCAL_NODE } }), ADDRESS);

    expect(balances).toEqual([{ value: 5n, asset: { type: "native" } }]);
    expect(queried).toEqual([LOCAL_NODE]);
  });

  it("queries mainnet when the config names no node", async () => {
    await api.getBalance(contextWith({}), ADDRESS);

    expect(queried).toEqual(["https://ic0.app"]);
  });

  it("broadcasts to the node the config names", async () => {
    jest.mocked(broadcast).mockResolvedValue("hash");

    await api.broadcast(contextWith({ node: { url: LOCAL_NODE } }), "aa");

    expect(broadcast).toHaveBeenCalledWith(LOCAL_NODE, "aa");
  });

  it("reads the tip, a block and the history from the node the config names", async () => {
    const context = contextWith({ node: { url: LOCAL_NODE } });

    await api.lastBlock(context);
    await api.getBlockInfo(context, 1);
    await api.listOperations(context, ADDRESS, { minHeight: 0 });

    expect(lastBlock).toHaveBeenCalledWith(LOCAL_NODE);
    expect(getBlockInfo).toHaveBeenCalledWith(LOCAL_NODE, 1);
    expect(listOperations).toHaveBeenCalledWith(LOCAL_NODE, ADDRESS, { minHeight: 0 });
  });

  it("reads a stake account from the node the config names", async () => {
    await api.validateIntent(contextWith({ node: { url: LOCAL_NODE } }), {} as IcpIntent, []);

    const [resolveHost] = jest.mocked(validateIntentWithStakeAccount).mock.calls[0];
    await expect(resolveHost()).resolves.toBe(LOCAL_NODE);
  });
});
