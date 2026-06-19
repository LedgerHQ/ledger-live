import { firstValueFrom } from "rxjs";
import { filter } from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-env";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "../../generated/types";
import { loadSetupForFamily } from "../../coin-modules/registry";
import { getAccountBridge } from "../../bridge/index";
import { waitForTransactionConfirmation } from "../../families/evm/waitForConfirmation";
import type { TokenApprovalOpts } from "./types";
import { scan } from "./scan";

type Inferred = { account: AccountLike; mainAccount: Account; transaction: Transaction };

type CliTools = {
  inferAccounts?: (account: Account, opts: Record<string, unknown>) => AccountLike[];
  inferTransactions: (
    transactions: Inferred[],
    opts: Partial<Record<string, string | string[]>>,
  ) => Promise<Transaction[]>;
};

export async function cmdTokenApproval(opts: TokenApprovalOpts): Promise<string> {
  const mainAccount = await firstValueFrom(
    scan({ currency: opts.currency, index: opts.index, length: 1 }),
  );

  const bridge = await getAccountBridge(mainAccount);
  const setup = await loadSetupForFamily(mainAccount.currency.family);
  const cliTools: CliTools | undefined = setup?.cliTools;

  if (!cliTools?.inferTransactions) {
    throw new Error(`No cli tools for family ${mainAccount.currency.family}`);
  }

  const cliOpts: Record<string, string | string[]> = {
    mode: opts.mode,
    spender: opts.spender,
    token: opts.token,
  };
  if (opts.approveAmount) cliOpts.approveAmount = opts.approveAmount;

  const accounts = cliTools.inferAccounts?.(mainAccount, cliOpts) ?? [mainAccount];
  const base: Inferred[] = accounts.map(account => ({
    account,
    mainAccount,
    transaction: bridge.createTransaction(mainAccount),
  }));

  const inferred = await cliTools.inferTransactions(base, cliOpts);
  const broadcastDisabled = !!getEnv("DISABLE_TRANSACTION_BROADCAST");
  const hashes: string[] = [];

  for (const tx of inferred) {
    const prepared = await bridge.prepareTransaction(mainAccount, tx);
    const status = await bridge.getTransactionStatus(mainAccount, prepared);
    const errorKeys = Object.keys(status.errors);
    if (errorKeys.length) throw status.errors[errorKeys[0]];

    const signed = await firstValueFrom(
      bridge
        .signOperation({ account: mainAccount, transaction: prepared, deviceId: "" })
        .pipe(filter(e => e.type === "signed")),
    );
    if (signed.type !== "signed") throw new Error("transaction was not signed");

    if (broadcastDisabled) continue;

    const op = await bridge.broadcast({
      account: mainAccount,
      signedOperation: signed.signedOperation,
    });
    if (op.hash) hashes.push(op.hash);

    if (opts.waitConfirmation && op.hash && mainAccount.currency.family === "evm") {
      await waitForTransactionConfirmation(mainAccount, op.hash);
    }
  }

  return hashes.join(",");
}
