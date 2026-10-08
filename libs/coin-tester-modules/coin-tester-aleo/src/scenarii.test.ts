import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killStack, spawnStack, registerTeardownHooks } from "./stack";
import { scenarioTransferPublic } from "./scenarii/transferPublic";
import { scenarioTransferPrivate } from "./scenarii/transferPrivate";
import { scenarioTransferPrivateToPublic } from "./scenarii/transferPrivateToPublic";

jest.setTimeout(600_000);

registerTeardownHooks();

// One Docker stack for the whole file; each scenario runs on fresh accounts.
beforeAll(
  async () => {
    await spawnStack();
  },
  10 * 60 * 1000,
);

afterAll(async () => {
  await killStack();
});

describe("Aleo Deterministic Tester", () => {
  it("scenario public transfer and send-max", () => executeScenario(scenarioTransferPublic));
  it("scenario private transfer", () => executeScenario(scenarioTransferPrivate));
  it("scenario private-to-public unshield", () => executeScenario(scenarioTransferPrivateToPublic));
});
