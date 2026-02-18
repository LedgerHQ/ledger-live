import { readFile } from "fs/promises";

export const getUserdata = async (userdataFile: string) => {
  const jsonFile = await readFile(userdataFile, "utf-8");
  return JSON.parse(jsonFile);
};

const POLL_INTERVAL_MS = 200;
const DEFAULT_TIMEOUT_MS = 10000;

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

/**
 * Waits up to `timeoutMs` for the account name to be persisted in the userdata file.
 * Polls every POLL_INTERVAL_MS. Use after rename-account flow to assert db middleware persisted.
 */
export async function waitForAccountRenamed(
  userdataFile: string,
  expectedName: string,
  accountIndex: number = 0,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastValue: string | undefined;
  let lastError: Error | null = null;
  while (Date.now() < deadline) {
    try {
      const userData = await getUserdata(userdataFile);
      const accountNames = userData?.data?.wallet?.accountsData?.accountNames;
      lastValue = accountNames?.[accountIndex]?.[1];
      if (lastValue === expectedName) {
        return;
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(
    `Account name was not renamed to "${expectedName}" within ${timeoutMs}ms. Last value: "${lastValue}". ${lastError ? lastError.message : ""}`,
  );
}
