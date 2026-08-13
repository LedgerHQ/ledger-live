import { log } from "@ledgerhq/logs";
import { computeA4AccountVersion } from "./accountVersion";
import { toA4HttpError } from "./errors";
import type { A4Client } from "./index";

const registrationCache = new Set<string>();

export function clearA4RegistrationCache(): void {
  registrationCache.clear();
}

async function register(
  client: A4Client,
  accountId: string,
  addresses: string[],
  key: string,
): Promise<void> {
  try {
    await client.createAccount(accountId);
    await client.addAddresses(accountId, addresses);
    registrationCache.add(key);
  } catch (rawErr) {
    const err = toA4HttpError(rawErr);
    log("a4", `registration failed for ${accountId}: ${err.message}`);
  }
}

async function reconcile(
  client: A4Client,
  accountId: string,
  addresses: string[],
  key: string,
  version: string,
): Promise<void> {
  try {
    const { version: sv } = await client.addAddresses(accountId, addresses);
    if (sv === version) {
      registrationCache.add(key);
    } else {
      log("a4", `reconcile: server settled at ${sv}, expected ${version}, will retry on next sync`);
    }
  } catch (rawErr) {
    const err = toA4HttpError(rawErr);
    log("a4", `addAddresses failed for ${accountId}: ${err.message}`);
  }
}

export async function ensureA4Registered(
  client: A4Client,
  accountId: string,
  addresses: string[],
): Promise<void> {
  const version = computeA4AccountVersion(addresses);
  const key = `${accountId}:${version}`;

  if (registrationCache.has(key)) {
    return;
  }

  try {
    await client.getAccount(accountId, version);
    registrationCache.add(key);
  } catch (rawErr) {
    const err = toA4HttpError(rawErr);

    if (err.status === undefined) {
      log("a4", `registration transport error for ${accountId}: ${err.message}`);
      return;
    }

    if (err.status === 404) {
      await register(client, accountId, addresses, key);
      return;
    }

    if (err.status === 412) {
      await reconcile(client, accountId, addresses, key, version);
      return;
    }

    log("a4", `unexpected A4 error (status ${err.status}) for ${accountId}: ${err.message}`);
  }
}
