import { killSpeculos } from "@ledgerhq/coin-tester/docker";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killAnvil } from "./docker";
import { scenarioEthereum } from "./scenarios/ethereum";
import { scenarioPolygon } from "./scenarios/polygon";

jest.setTimeout(600_000); // 10 Min
global.console = require("console");

afterAll(async () => {
  await Promise.all([killSpeculos(), killAnvil()]);
});

describe("EVM Deterministic Tester", () => {
  it("scenario Ethereum", async () => {
    try {
      await executeScenario(scenarioEthereum);
    } catch (e) {
      if (e != "done") {
        await Promise.all([killSpeculos(), killAnvil()]);
        throw e;
      }
    }
  });

  it("scenario polygon", async () => {
    try {
      await executeScenario(scenarioPolygon);
    } catch (e) {
      if (e != "done") {
        await Promise.all([killSpeculos(), killAnvil()]);
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
  }),
);
