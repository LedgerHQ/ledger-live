import { readFile } from "fs/promises";

export const getUserdata = async (userdataFile: string) => {
  const jsonFile = await readFile(userdataFile, "utf-8");
  return JSON.parse(jsonFile);
};

const POLL_INTERVAL_MS = 200;

/**
 * Waits up to `timeoutMs` for app.json to contain at least `minCount` accounts in data.accounts.
 * Polls every POLL_INTERVAL_MS. Use after add-account flow to assert db middleware persisted.
 */
export async function waitForAccountsPersisted(
  userdataFile: string,
  minCount: number,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: Error | null = null;
  while (Date.now() < deadline) {
    try {
      const parsed = (await getUserdata(userdataFile)) as { data?: { accounts?: unknown[] } };
      const accounts = parsed?.data?.accounts;
      if (Array.isArray(accounts) && accounts.length >= minCount) {
        return;
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(
    `app.json did not contain at least ${minCount} account(s) within ${timeoutMs}ms. ${lastError ? lastError.message : ""}`,
  );
}
