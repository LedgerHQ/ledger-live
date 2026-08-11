import { ethers } from "ethers";
import {
  killSendPerfAnvil,
  runLayer1Fixture,
  spawnSendPerfAnvil,
} from "./engine/layer1Runner";
import { runLayer2Fixture } from "./engine/layer2Runner";
import {
  ANVIL_RPC,
  ETH_LAYER1_SCENARIOS,
  ETH_LAYER2_SCENARIOS,
} from "./scenarios/eth/scenarios";

jest.setTimeout(120_000);

const layerOnly = process.env.SEND_PERF_LAYER === "1";

describe("Send Performance Harness — ETH", () => {
  let provider: ethers.JsonRpcProvider;

  beforeAll(async () => {
    await spawnSendPerfAnvil();
    provider = new ethers.JsonRpcProvider(ANVIL_RPC);
    await provider.getBlockNumber();
  });

  beforeEach(async () => {
    await provider.send("anvil_setAutomine", [true]);
  });

  afterAll(async () => {
    try {
      await provider.send("anvil_setAutomine", [true]);
    } catch {
      // ignore if anvil already stopped
    }
    await killSendPerfAnvil();
  });

  describe("Layer 1 — node rejection (Guillaume method)", () => {
    it.each(ETH_LAYER1_SCENARIOS.map(s => [s.fixture.id, s]))(
      "%s",
      async (_id, scenario) => {
        const signedTx = await scenario.buildSignedTx(provider);
        await runLayer1Fixture(provider, scenario.fixture, signedTx);
      },
    );
  });

  if (!layerOnly) {
    describe("Layer 2 — coin-evm broadcast path", () => {
      it.each(ETH_LAYER2_SCENARIOS.map(s => [s.fixture.id, s]))(
        "%s",
        async (_id, scenario) => {
          const signedTx = await scenario.buildSignedTx(provider, scenario.walletIndex);
          await runLayer2Fixture(
            scenario.fixture.id,
            signedTx,
            scenario.fixture.expectReject,
            scenario.fixture.expectErrorClass,
          );
        },
      );
    });
  }
});
