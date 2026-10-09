import { allure } from "jest-allure2-reporter/api";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";

export function setTeamOwner(team: Team): void {
  $Owner(team);
  $ParentSuite(team);
}

// Allure 3 never renders `description` when jest-allure2-reporter also writes an empty
// `descriptionHtml`, so descriptions go through `allure.descriptionHtml` — QAA-1535.
// Each call's HTML must be a self-contained block: the reporter joins them with a bare "\n".
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function setAllureDescription(): void {
  const testPath = expect.getState().testPath ?? "";
  const testFileName = testPath.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1") || "unknown";
  const shardIndex = process.env.SHARD_INDEX;
  const shardLine = shardIndex ? `<br>🔢 Shard: ${escapeHtml(shardIndex)}` : "";

  allure.descriptionHtml(`<p>📄 Test file: ${escapeHtml(testFileName)}${shardLine}</p>`);
}
