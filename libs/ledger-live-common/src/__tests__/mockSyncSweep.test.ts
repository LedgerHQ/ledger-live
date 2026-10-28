/**
 * Generate one mock account per supported currency and sync it against the live network,
 * reporting per-currency failures.
 *
 * shortcut: it hits the real APIs (several minutes, and a flaky endpoint fails it), so it is
 * not run per-PR; upgrade to a mocked network if it ever needs to gate CI.
 */
import "./test-helpers/environment";
import { firstValueFrom } from "rxjs";
import { getAccountBridge } from "../bridge/impl";
import { genAccount } from "../mock/account";
import { listSupportedCurrencies } from "../coin-modules/registry";

jest.setTimeout(1800000);

const PER_CURRENCY_TIMEOUT = Number(process.env.SWEEP_TIMEOUT ?? 90000);

/** SWEEP_ONLY=concordium_testnet,filecoin narrows the sweep while debugging. */
const SWEEP_ONLY = process.env.SWEEP_ONLY?.split(",").filter(Boolean);

/** Flatten whatever shape an error has (axios/grpc/wrapped) into one readable line. */
function fmtErr(e: unknown): string {
  const err = e as any;
  const parts: string[] = [];
  if (err?.name && err.name !== "Error") parts.push(`[${err.name}]`);
  if (err?.message) parts.push(String(err.message));
  const status = err?.response?.status ?? err?.status;
  if (status) parts.push(`status=${status}`);
  if (err?.url) parts.push(`url=${JSON.stringify(err.url)}`);
  if (err?.response?.data !== undefined) {
    parts.push(`data=${JSON.stringify(err.response.data).slice(0, 200)}`);
  }
  if (err?.cause) parts.push(`cause=${err.cause?.message ?? String(err.cause)}`);
  if (err?.error) parts.push(`inner=${err.error?.message ?? String(err.error)}`);
  if (err?.stack && parts.length < 2) parts.push(String(err.stack).split("\n")[1]?.trim() ?? "");
  return parts.join(" | ").slice(0, 300) || String(e);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`TIMEOUT after ${ms}ms (${label})`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

test("mock accounts sync on every supported currency", async () => {
  const currencies = listSupportedCurrencies().filter(
    c => !SWEEP_ONLY || SWEEP_ONLY.includes(c.id),
  );
  const failures: string[] = [];
  let ok = 0;

  for (const currency of currencies) {
    try {
      const account = genAccount(`sweep-${currency.id}`, { currency });
      const bridge = await withTimeout(
        getAccountBridge(account, null),
        PER_CURRENCY_TIMEOUT,
        `${currency.id}:bridge`,
      );
      await withTimeout(
        firstValueFrom(bridge.sync(account, {} as never)),
        PER_CURRENCY_TIMEOUT,
        `${currency.id}:sync`,
      );
      ok += 1;
      // eslint-disable-next-line no-console
      console.log(`OK   ${currency.id}`);
    } catch (e) {
      const msg = fmtErr(e);
      failures.push(`${currency.id} :: ${msg}`);
      // eslint-disable-next-line no-console
      console.log(`FAIL ${currency.id} :: ${msg}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\nSWEEP ${currencies.length} currencies, ${failures.length} failures, ${ok} ok\n`);
  // eslint-disable-next-line no-console
  console.log(failures.map(f => `SWEEPFAIL ${f}`).join("\n"));
});
