import Client from "bitcoin-core";
import {
  createBtcClient,
  killBtcRegtest,
  spawnBtcRegtest,
} from "./engine/btcRegtest";
import { BTC_LAYER1_SCENARIOS, prepareBtcWallet } from "./scenarios/btc/scenarios";

jest.setTimeout(300_000);

describe("Send Performance Harness — BTC", () => {
  let client: Client;

  beforeAll(async () => {
    await spawnBtcRegtest();
    client = createBtcClient();
    await prepareBtcWallet(client);
  });

  afterAll(async () => {
    await killBtcRegtest();
  });

  describe("Layer 1 — regtest node rejection", () => {
    it.each(BTC_LAYER1_SCENARIOS.map(s => [s.fixture.id, s]))(
      "%s",
      async (_id, scenario) => {
        await prepareBtcWallet(client);
        await scenario.run(client);
      },
    );
  });
});
