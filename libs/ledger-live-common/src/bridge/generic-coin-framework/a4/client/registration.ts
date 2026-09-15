import { computeA4AccountVersion } from "./accountVersion";
import { toA4HttpError } from "./errors";
import { logA4 } from "../log";
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
  chain: string,
): Promise<void> {
  try {
    await client.createAccount(accountId);
  } catch (rawErr) {
    const err = toA4HttpError(rawErr);
    logA4({
      level: "warn",
      message: `A4 createAccount failed: ${err.message}`,
      decision: "register_create_failed",
      chain,
      method: "createAccount",
      status: err.status,
      a4AccountId: accountId,
      error: err,
    });
    return;
  }

  try {
    await client.addAddresses(accountId, addresses);
    registrationCache.add(key);
    logA4({
      level: "info",
      message: "A4 account created",
      decision: "register_created",
      chain,
      method: "addAddresses",
      a4AccountId: accountId,
    });
  } catch (rawErr) {
    const err = toA4HttpError(rawErr);
    logA4({
      level: "warn",
      message: `A4 addAddresses failed: ${err.message}`,
      decision: "register_create_failed",
      chain,
      method: "addAddresses",
      status: err.status,
      a4AccountId: accountId,
      error: err,
    });
  }
}

async function reconcile(
  client: A4Client,
  accountId: string,
  addresses: string[],
  key: string,
  version: string,
  chain: string,
): Promise<void> {
  try {
    const { version: sv } = await client.addAddresses(accountId, addresses);
    if (sv === version) {
      registrationCache.add(key);
      logA4({
        level: "info",
        message: "A4 account reconciled",
        decision: "register_reconciled",
        chain,
        method: "addAddresses",
        a4AccountId: accountId,
      });
    } else {
      logA4({
        level: "warn",
        message: `A4 reconcile version mismatch: server settled at ${sv}, expected ${version}, will retry on next sync`,
        decision: "register_reconcile_pending",
        chain,
        method: "addAddresses",
        a4AccountId: accountId,
      });
    }
  } catch (rawErr) {
    const err = toA4HttpError(rawErr);
    logA4({
      level: "warn",
      message: `A4 reconcile failed: ${err.message}`,
      decision: "register_reconcile_failed",
      chain,
      method: "addAddresses",
      status: err.status,
      a4AccountId: accountId,
      error: err,
    });
  }
}

export async function ensureA4Registered(
  client: A4Client,
  accountId: string,
  addresses: string[],
  chain: string,
): Promise<void> {
  const version = computeA4AccountVersion(addresses);
  const key = `${accountId}:${version}`;

  if (registrationCache.has(key)) {
    return;
  }

  try {
    await client.getAccount(accountId, version);
    registrationCache.add(key);
    logA4({
      level: "info",
      message: "A4 account already up to date",
      decision: "register_up_to_date",
      chain,
      method: "getAccount",
      a4AccountId: accountId,
    });
  } catch (rawErr) {
    const err = toA4HttpError(rawErr);

    if (err.status === undefined) {
      logA4({
        level: "warn",
        message: `A4 registration transport error: ${err.message}`,
        decision: "register_transport_error",
        chain,
        method: "getAccount",
        a4AccountId: accountId,
        error: err,
      });
      return;
    }

    if (err.status === 404) {
      await register(client, accountId, addresses, key, chain);
      return;
    }

    if (err.status === 412) {
      await reconcile(client, accountId, addresses, key, version, chain);
      return;
    }

    logA4({
      level: "error",
      message: `A4 registration unexpected error (status ${err.status}): ${err.message}`,
      decision: "register_unexpected_status",
      chain,
      method: "getAccount",
      status: err.status,
      a4AccountId: accountId,
      error: err,
    });
  }
}
