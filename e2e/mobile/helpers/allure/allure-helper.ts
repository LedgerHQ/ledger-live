import { allure } from "jest-allure2-reporter/api";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";

export function setTeamOwner(team: Team): void {
  $Owner(team);
  $ParentSuite(team);
}

/**
 * Reports the test as one iteration of the data-driven Xray test `testKey`, with `parameters`
 * as its dataset row — so one failing coin shows red while the others stay green. See QAA-1451.
 *
 * Call it in the `describe` body with **no Jest registration between it and the `it(...)`**.
 * Annotations are queued and flushed onto whatever node the next Jest event creates, so a
 * `beforeAll`, a nested `describe` or a second `it` slipped in between would silently redirect
 * them onto that node instead. Links and labels survive it (they are inherited from the describe
 * block) but parameters are not, so the iteration would just vanish with no error.
 */
export function setXrayDataset(testKey: string, parameters: Record<string, string>): void {
  $TmsLink(testKey);
  for (const [name, value] of Object.entries(parameters)) {
    $Parameter(name, value);
  }
}

export function setAllureDescription(): void {
  const testPath = expect.getState().testPath ?? "";
  const testFileName = testPath.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1") || "unknown";
  const shardIndex = process.env.SHARD_INDEX;
  const shardLine = shardIndex ? `\n🔢 Shard: ${shardIndex}` : "";

  allure.description(`📄 Test file: ${testFileName}` + shardLine);
}
