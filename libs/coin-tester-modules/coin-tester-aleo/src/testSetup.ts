import { firstValueFrom, reduce } from "rxjs";
import type { SetupServerApi } from "msw/node";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { AleoAccount, Transaction as AleoTransaction } from "@ledgerhq/coin-aleo/types";
import { waitForPublicBalance } from "./devnode";
import { buildTransaction } from "./msw/prove";

/** Bypasses the prove handler: genesis pays its own fee, and no sponsor is involved. */
export async function fundFromGenesis(recipientAddress: string, amount: number): Promise<void> {
  await buildTransaction({ recipient: recipientAddress, amount });
  await waitForPublicBalance(recipientAddress, BigInt(amount));
}

const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

export function startMockServer(server: SetupServerApi): void {
  server.listen({
    onUnhandledRequest: request => {
      const { hostname } = new URL(request.url);
      if (LOCAL_HOSTNAMES.has(hostname)) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });
}

export function syncAccount(
  bridge: AccountBridge<AleoTransaction, AleoAccount>,
  account: AleoAccount,
): Promise<AleoAccount> {
  return firstValueFrom(
    bridge
      .sync(account, { paginationConfig: {} })
      .pipe(reduce((synced, applyPatch) => applyPatch(synced), account)),
  );
}
