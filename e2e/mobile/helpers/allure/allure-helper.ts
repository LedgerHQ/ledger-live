import { allure } from "jest-allure2-reporter/api";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";

export function setTeamOwner(team: Team): void {
  $Owner(team);
  $ParentSuite(team);
}

export function setAllureDescription(): void {
  const testPath = expect.getState().testPath ?? "";
  const testFileName = testPath.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1") || "unknown";
  const shardIndex = process.env.SHARD_INDEX;
  const shardLine = shardIndex ? `\n🔢 Shard: ${shardIndex}` : "";

  allure.description(`📄 Test file: ${testFileName}` + shardLine);
}
