import path from "path";
import fs from "fs";
import { RecordStore, TransportReplayer } from "@ledgerhq/hw-transport-mocker";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { ScenarioOptions } from "../../../tests/test-helpers/types";
import { getSdk } from "../..";
import { WithDevice } from "../../types";

setEnv("MOCK", "true");

const nonMockableScenarios = [
  "randomMemberTryToDestroy", // can't simulate seed<>trustchain relationship
  "removeMemberWithTheWrongSeed", // can't simulate seed<>trustchain relationship
  "tokenExpires", // can't simulate token expiration
  "userRefusesAuth", // can't simulate device interaction at the moment
  "userRefusesRemoveMember", // can't simulate device interaction at the moment
  "ringInitPreservesLedgerSyncMember", // mock SDK does not model per-app member eviction
];

const scenarioFolder = path.join(__dirname, "../../../tests/scenarios");
fs.readdirSync(scenarioFolder).forEach(file => {
  if (file.endsWith(".ts") && !file.startsWith("_")) {
    const slug = file.slice(0, -3);
    if (nonMockableScenarios.includes(slug)) return;
    const e2eFile = path.join(scenarioFolder, file);
    // oxlint-disable-next-line typescript/no-require-imports -- dynamic scenario path
    const mod = require(e2eFile);
    test(slug, async () => {
      const scenario = mod.scenario;
      const transport = new TransportReplayer(new RecordStore());
      const device = { id: "", transport };
      const withDevice: WithDevice = () => fn => fn(device.transport);
      const options: ScenarioOptions = {
        withDevice,
        sdkForName: (name, opts) =>
          getSdk(
            !!getEnv("MOCK"),
            {
              applicationId: opts?.applicationId ?? 16,
              name,
              apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
            },
            withDevice,
          ),
        pauseRecorder: () => Promise.resolve(), // replayer don't need to pause
        switchDeviceSeed: async () => device, // nothing to actually do, we will continue replaying
      };
      await scenario(device.id, options);
    });
  }
});
