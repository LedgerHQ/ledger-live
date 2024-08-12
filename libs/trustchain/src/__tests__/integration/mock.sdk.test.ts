import path from "path";
import fs from "fs";
import { TransportReplayer } from "@ledgerhq/hw-transport-mocker/lib/openTransportReplayer";
import { RecordStore } from "@ledgerhq/hw-transport-mocker";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { ScenarioOptions } from "../../../tests/test-helpers/types";
import { getSdk } from "../..";

setEnv("MOCK", "true");

const nonMockableScenarios = [
  "randomMemberTryToDestroy", // can't simulate seed<>trustchain relationship
  "removeMemberWithTheWrongSeed", // can't simulate seed<>trustchain relationship
  "tokenExpires", // can't simulate token expiration
  "userRefusesAuth", // can't simulate device interaction at the moment
  "userRefusesRemoveMember", // can't simulate device interaction at the moment
];

const scenarioFolder = path.join(__dirname, "../../../tests/scenarios");
fs.readdirSync(scenarioFolder).forEach(file => {
  if (file.endsWith(".ts") && !file.startsWith("_")) {
    const slug = file.slice(0, -3);
    if (nonMockableScenarios.includes(slug)) return;
    const e2eFile = path.join(scenarioFolder, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(e2eFile);
    test(slug, async () => {
      const scenario = mod.scenario;
      const transport = new TransportReplayer(new RecordStore());
      const options: ScenarioOptions = {
        sdkForName: name =>
          getSdk(!!getEnv("MOCK"), {
            applicationId: 16,
            name,
            apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
          }),
        pauseRecorder: () => Promise.resolve(), // replayer don't need to pause
        switchDeviceSeed: async () => transport, // nothing to actually do, we will continue replaying
      };
      await scenario(transport, options);
    });
  }
});
