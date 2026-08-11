import chalk from "chalk";
import * as compose from "docker-compose";
import { Connection } from "@solana/web3.js";
import { runSolLayer2Fixture } from "./engine/solLayer2Runner";
import { SOL_LAYER1_SCENARIOS, SOL_RPC } from "./scenarios/sol/scenarios";
import { runSolLayer2Scenario, SOL_LAYER2_SCENARIOS } from "./scenarios/sol/layer2";

jest.setTimeout(180_000);

const agaveCwd = `${__dirname}/../../coin-tester-solana`;

async function waitForSolRpc(rpcUrl: string, maxAttempts = 90): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getVersion" }),
        signal: AbortSignal.timeout(2_000),
      });
      if (res.ok) {
        const json = (await res.json()) as { result?: unknown };
        if (json.result) return;
      }
    } catch {
      // validator still booting
    }
    await new Promise(r => setTimeout(r, 1_000));
  }
  throw new Error("Agave validator did not become ready");
}

async function spawnAgave(): Promise<void> {
  console.log("Starting Agave test validator...");
  await compose.upOne("agave", {
    cwd: agaveCwd,
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });
  console.log(chalk.bgBlueBright(" -  AGAVE READY  - "));
}

async function killAgave(): Promise<void> {
  await compose.down({
    cwd: agaveCwd,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
}

describe("Send Performance Harness — SOL", () => {
  let connection: Connection;
  const layerOnly = process.env.SEND_PERF_LAYER === "1";

  beforeAll(async () => {
    await spawnAgave();
    await waitForSolRpc(SOL_RPC);
    connection = new Connection(SOL_RPC, "confirmed");
  });

  afterAll(async () => {
    await killAgave();
  });

  describe("Layer 1 — validator rejection", () => {
    it.each(SOL_LAYER1_SCENARIOS.map(s => [s.fixture.id, s]))(
      "%s",
      async (_id, scenario) => {
        await scenario.run(connection);
      },
    );
  });

  if (!layerOnly) {
    describe("Layer 2 — coin-solana broadcast path", () => {
      it.each(SOL_LAYER2_SCENARIOS.map(s => [s.fixture.id, s]))(
        "%s",
        async (_id, scenario) => {
          const { account, signedOperation } = await runSolLayer2Scenario(connection, scenario);
          await runSolLayer2Fixture(
            scenario.fixture.id,
            account,
            signedOperation,
            scenario.fixture.expectReject,
            scenario.fixture.expectErrorClass,
            scenario.fixture.id === "sol-simulation-failed-no-pending-op"
              ? ["insufficient funds", "insufficient lamports"]
              : [],
          );
        },
      );
    });
  }
});
