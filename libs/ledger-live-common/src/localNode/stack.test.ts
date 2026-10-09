/**
 * Runs a currency against its local stack and fails on any request that leaves the machine.
 * Opt-in, as the chain and coin-sandbox's server must be up (`deno task chain base up`,
 * `deno task server`):
 *
 *   LOCAL_NODE_STACK=base pnpm common jest src/localNode/stack.test.ts
 */
import { http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getGasTracker } from "@ledgerhq/coin-evm/network";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../config";
import { liveConfig } from "../config/sharedConfig";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import { loadLocalNodes, setLocalNodeCurrencies } from ".";

const CURRENCY = process.env.LOCAL_NODE_STACK ?? "";
const describeWithStack = CURRENCY ? describe : describe.skip;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** A funded account of each family's local chain, and the transaction type its fees are for. */
const SAMPLES: Record<string, { address: string; sendType: string }> = {
  // Anvil's first dev account: its keys are public, so it is never one of a test seed's accounts.
  evm: { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", sendType: "send-eip1559" },
  // The genesis account of a standalone XRP ledger.
  xrp: { address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", sendType: "send" },
  // Any address, funded with the airdrop first: a transfer's fee needs an existing sender.
  solana: { address: "EpAxPozAvGGn3hD5XnqvWVtewEW82CaTQnX6EVm1vjur", sendType: "transfer" },
  // Any address: the sync of an unknown one exercises the same endpoints.
  tron: { address: "TQDyHP3QX24zSDn5418DHm2hvYs2wzuYYY", sendType: "send" },
};

describeWithStack(`${CURRENCY} on its local node`, () => {
  const localRequests: string[] = [];
  const remoteRequests: string[] = [];
  // Remote requests are refused on the spot rather than let through: a leak then fails fast and
  // names its URL, instead of hanging on a network the test does not control.
  const server = setupServer(
    http.all("*", ({ request }) => {
      const url = new URL(request.url);
      const target = `${request.method} ${url.origin}${url.pathname}`;
      if (LOCAL_HOSTS.has(url.hostname)) {
        localRequests.push(target);
        return passthrough();
      }
      remoteRequests.push(target);
      return HttpResponse.error();
    }),
  );

  // The configuration comes from coin-sandbox's running server, as in the app
  beforeAll(async () => {
    LiveConfig.setConfig(liveConfig);
    server.listen({ onUnhandledRequest: "error" });
    setLocalNodeCurrencies([CURRENCY]);
    await loadLocalNodes();
  });

  afterAll(() => {
    server.close();
    setLocalNodeCurrencies([]);
  });

  it("syncs, estimates and prices fees without leaving localhost", async () => {
    const { family } = getCryptoCurrencyById(CURRENCY);
    const { address, sendType } = SAMPLES[family];
    const run = async () => {
      const api = await getCoinModuleApi(CURRENCY, "local");
      const context = buildContext(CURRENCY);

      await api.lastBlock(context);
      await api.getBalance(context, address);
      await api.listOperations(context, address, { minHeight: 0, order: "desc" });
      await api.estimateFees(context, {
        intentType: "transaction",
        type: sendType,
        sender: address,
        recipient: address,
        amount: 1n,
        asset: { type: "native" },
      });
      if (family === "evm") {
        // The send screen's fee speeds, read outside the coin-module API.
        const config = getCurrencyConfiguration<EvmConfigInfo>(CURRENCY);
        await getGasTracker(config)?.getGasOptions({ config, options: { useEIP1559: true } });
      }
    };
    const failure = await run().then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(remoteRequests).toEqual([]);
    expect(failure).toBeUndefined();
    expect(localRequests.length).toBeGreaterThan(0);
  });
});
