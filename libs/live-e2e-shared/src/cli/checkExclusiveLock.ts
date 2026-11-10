import { appendFile } from "node:fs/promises";
import { exclusiveLockStoreFailure } from "../exclusiveLock";

// A workflow command ends with its line.
const escapeCommandData = (data: string) =>
  data.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");

/**
 * Sets the `mode` output of a CI step, for the E2E_EXCLUSIVE_LOCK_MODE of the tests after it:
 * "remote" while R2 takes lock writes, otherwise "local", with a warning annotation.
 */
export async function runCheckExclusiveLockCommand(): Promise<void> {
  const failure = await exclusiveLockStoreFailure();
  if (failure) {
    const warning = `R2 failed its check, so this job locks the shared accounts on its own machine only: tests on other CI machines may broadcast from them at the same time. ${failure}`;
    console.log(
      `::warning title=Exclusive lock on this machine only::${escapeCommandData(warning)}`,
    );
  } else {
    console.log(
      "[exclusiveLock] R2 passed its check: this job locks the shared accounts across CI machines",
    );
  }
  const output = process.env.GITHUB_OUTPUT;
  if (output) await appendFile(output, `mode=${failure ? "local" : "remote"}\n`);
}
