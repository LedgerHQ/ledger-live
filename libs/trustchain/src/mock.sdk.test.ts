import path from "path";
import fs from "fs";
import { TransportReplayer } from "@ledgerhq/hw-transport-mocker/lib/openTransportReplayer";
import { RecordStore } from "@ledgerhq/hw-transport-mocker";
import { setEnv } from "@ledgerhq/live-env";

setEnv("MOCK", "true");

const nonMockableScenarios = [
  "randomMemberTryToDestroy", // can't simulate seed<>trustchain relationship
  "removeMemberWithTheWrongSeed", // can't simulate seed<>trustchain relationship
  "tokenExpires", // can't simulate token expiration
  "userRefusesAuth", // can't simulate device interaction at the moment
];

const scenarioFolder = path.join(__dirname, "./test-scenarios");
fs.readdirSync(scenarioFolder).forEach(file => {
  if (file.endsWith(".ts") && !file.startsWith("_")) {
    const slug = file.slice(0, -3);
    if (nonMockableScenarios.includes(slug)) return;
    const e2eFile = path.join(scenarioFolder, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(e2eFile);
    test(slug, async () => {
      const scenario = mod.scenario;
      await scenario(new TransportReplayer(new RecordStore()));
    });
  }
});
