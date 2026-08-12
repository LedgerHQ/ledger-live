import { firstValueFrom, reduce } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { createBridges } from "@ledgerhq/coin-casper/bridge";
import resolver from "@ledgerhq/coin-casper/signer";
import type { CasperAccount, Transaction } from "@ledgerhq/coin-casper/types";
import { scenarioCoinConfig } from "./fixtures";
import { buildCasperSigner } from "./signer";

// `createBridges` applies the coin config itself, so only LiveConfig is seeded here.
export function getBridges(pemByPath: Record<string, string>): ReturnType<typeof createBridges> {
  LiveConfig.setConfig({
    config_currency_casper: { type: "object", default: scenarioCoinConfig },
  });

  const signer = buildCasperSigner(pemByPath);
  const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(signer);

  return createBridges(signerContext, () => scenarioCoinConfig);
}

export const syncAccount = (
  bridge: AccountBridge<Transaction, CasperAccount>,
  account: CasperAccount,
): Promise<CasperAccount> =>
  firstValueFrom(
    bridge.sync(account, { paginationConfig: {} }).pipe(reduce((acc, f) => f(acc), account)),
  );
