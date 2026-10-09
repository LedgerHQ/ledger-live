import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "../config/sharedConfig";
import { getDefaultExplorerView, getTransactionExplorer } from "../explorers";
import { LOCAL_NODE_SERVER_URL, loadLocalNodes, setLocalNodeCurrencies } from ".";
import { LOCAL_CHAINS } from "./server.mock";

const useLocalNodes = async (currencyIds: string[]) => {
  setLocalNodeCurrencies(currencyIds);
  await loadLocalNodes();
};

const txLink = (currencyId: string, hash: string) =>
  getTransactionExplorer(getDefaultExplorerView(getCryptoCurrencyById(currencyId)), hash);

describe("explorer links in local node mode", () => {
  const server = setupServer(
    http.get(`${LOCAL_NODE_SERVER_URL}/:family/chains`, ({ params }) =>
      HttpResponse.json(LOCAL_CHAINS[String(params.family)]),
    ),
  );

  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => setLocalNodeCurrencies([]));
  afterAll(() => server.close());

  it("keeps the real explorer while the currency runs on its default network", () => {
    expect(txLink("base", "0xh")).toMatch(/^https:\/\//);
  });

  it("links a local transaction to its chain's Blockscout UI", async () => {
    await useLocalNodes(["base"]);

    expect(txLink("base", "0xh")).toBe("http://localhost:3003/tx/0xh");
  });

  it("links a local Solana transaction to the Solana Explorer on the local validator", async () => {
    await useLocalNodes(["solana"]);

    expect(txLink("solana", "sig")).toBe(
      "http://localhost:3100/tx/sig?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899",
    );
  });

  it("shows no link rather than the real explorer when nothing local can show it", async () => {
    await useLocalNodes(["ripple", "ethereum", "tron"]);

    expect(getDefaultExplorerView(getCryptoCurrencyById("ripple"))).toBeUndefined();
    expect(getDefaultExplorerView(getCryptoCurrencyById("ethereum"))).toBeUndefined();
    expect(getDefaultExplorerView(getCryptoCurrencyById("tron"))).toBeUndefined();
  });
});
