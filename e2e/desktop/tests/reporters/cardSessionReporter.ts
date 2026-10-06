import { spawnSync } from "node:child_process";
import { CARD_SESSION_BOOTSTRAP_ENV } from "@ledgerhq/baanx-test-client";
import type { FullConfig, Reporter, Suite } from "@playwright/test/reporter";

export const PAYTAB_SPECS_DIR = "paytab";

/*
 * Custom reporter to handle card session creation for Pay tab specs.
 * The session is created once before workers start to avoid rate limiting errors.
 */
class CardSessionReporter implements Reporter {
  onBegin(_config: FullConfig, suite: Suite): void {
    if (process.argv.includes("--list") || process.env[CARD_SESSION_BOOTSTRAP_ENV]?.trim()) return;
    if (
      suite
        .allTests()
        .some(test => test.location.file.replaceAll("\\", "/").includes(`/${PAYTAB_SPECS_DIR}/`))
    ) {
      console.info("[CardSessionReporter] Creating a card session for the run...");
      const result = spawnSync(
        "pnpm",
        ["--silent", "--filter", "@ledgerhq/baanx-test-client", "token", "--session"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
      );
      const session = result.stdout?.trim() ?? "";
      if (result.status !== 0 || session.length === 0) {
        throw new Error(`Failed to create a card session!`);
      }
      process.env[CARD_SESSION_BOOTSTRAP_ENV] = session;
      console.info("[CardSessionReporter] Card session created.");
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

/**
 * Logs that someNewFunction was called.
 *
 * @returns Nothing.
 */
export function someNewFunction(): void {
  console.info("[LoggingUtils] someNewFunction called.");
}
/**
 * Logs that someOtherNewFunctionsDesktop was called.
 *
 * @returns Nothing.
 */
export function someOtherNewFunctionsDesktop(): void {
  console.info("[LoggingUtils] someOtherNewFunctionsDesktop called.");
}

export default CardSessionReporter;
