import {
  TRONIFY_E2E_PAYEES,
  startFakeTronify,
  tronifyCoinConfig,
  upstreamTronGrid,
  type FakeTronify,
  type FakeTronifyScenario,
} from "@ledgerhq/live-e2e-shared/tronify/index";
import { FakeTronifyChecks } from "tests/utils/fakeTronify";
import base from "tests/fixtures/common";

type TronifyScenario = { scenario: FakeTronifyScenario; params?: Record<string, unknown> };

type FakeTronifyFixtures = {
  tronifyScenario: TronifyScenario;
  tronify: FakeTronifyChecks;
};

type FakeTronifyWorkerFixtures = {
  fakeTronify: FakeTronify;
};

/**
 * A local fake standing in for Tronify and TronGrid, one per worker on a free port. The app's
 * coin-config points at it and is built after the scenario is set, so the app's first sync
 * already reads the scenario's balances.
 */
export const test = base.extend<FakeTronifyFixtures, FakeTronifyWorkerFixtures>({
  tronifyScenario: [{ scenario: "happy" }, { option: true }],

  fakeTronify: [
    async ({}, use) => {
      const fake = await startFakeTronify({
        port: 0,
        payees: TRONIFY_E2E_PAYEES,
        upstreamTronGrid: upstreamTronGrid(),
        usdtBalance: 50_000_000n,
        trxBalanceSun: 20_000_000n,
      });
      await use(fake);
      await fake.close();
    },
    { scope: "worker" },
  ],

  tronify: async ({ fakeTronify, tronifyScenario }, use, testInfo) => {
    fakeTronify.setScenario(tronifyScenario.scenario, tronifyScenario.params);
    await use(new FakeTronifyChecks(fakeTronify));

    // On failure only, like the other debug attachments (QAA-1433).
    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach("Fake Tronify requests", {
        body: JSON.stringify(fakeTronify.log(), null, 2),
        contentType: "application/json",
      });
    }
  },

  // Depends on `tronify` so the scenario is set before the app reads the coin-config.
  coinConfigOverrides: async ({ fakeTronify, tronify: _scenarioSet }, use) => {
    await use(tronifyCoinConfig(fakeTronify));
  },
});

export default test;
