import {
  Account,
  AccountRaw,
  OperationExtra,
  OperationExtraRaw,
  StakingAccount,
  TokenAccount,
  TokenAccountRaw,
} from "@ledgerhq/types-live";
import {
  assignStakingResourcesFromAccountRaw,
  assignStakingResourcesToAccountRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import {
  SolanaOperationExtra,
  SolanaOperationExtraRaw,
  SolanaStake,
  SolanaTokenAccount,
  SolanaTokenAccountRaw,
} from "./types";
import { solanaStakesToStakingResources } from "./logic/stakingResources";

type LegacyPersistedSolanaStakes = {
  stakes: string;
  unstakeReserve: string;
};

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  assignStakingResourcesToAccountRaw(account, accountRaw);
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  assignStakingResourcesFromAccountRaw(accountRaw, account);
  const stakingAccount = account as StakingAccount;
  if (stakingAccount.stakingResources) return;

  const legacyRaw = (accountRaw as AccountRaw & { solanaResources?: LegacyPersistedSolanaStakes })
    .solanaResources;
  if (!legacyRaw) return;

  // This runs while hydrating a persisted account, so a corrupted or older blob must degrade to
  // empty resources instead of throwing and blocking the account from loading at all.
  let stakes: SolanaStake[] = [];
  try {
    const parsed: unknown = JSON.parse(legacyRaw.stakes);
    if (Array.isArray(parsed)) {
      stakes = parsed;
    } else {
      log("warn", "solana: ignoring malformed persisted solanaResources.stakes");
    }
  } catch (error) {
    log("warn", "solana: failed to parse persisted solanaResources.stakes", {
      error,
    });
  }

  // The conversion reads fields like `activation.state` unguarded, so a corrupted entry would throw
  // here. The next sync rewrites `stakingResources` from the chain anyway, so degrading to empty is
  // enough: what matters is that the account still loads.
  const reserve = parsePersistedUnstakeReserve(legacyRaw.unstakeReserve);
  try {
    stakingAccount.stakingResources = solanaStakesToStakingResources(stakes, reserve);
  } catch (error) {
    log("warn", "solana: failed to revive persisted solanaResources.stakes items", { error });
    stakingAccount.stakingResources = solanaStakesToStakingResources([], reserve);
  }
}

function parsePersistedUnstakeReserve(value: unknown): BigNumber {
  try {
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new BigNumber(value);
      if (parsed.isFinite() && parsed.gte(0)) {
        return parsed;
      }
    }
  } catch (error) {
    log("warn", "solana: failed to parse persisted solanaResources.unstakeReserve", { error });
    return new BigNumber(0);
  }

  log("warn", "solana: ignoring malformed persisted solanaResources.unstakeReserve");
  return new BigNumber(0);
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  const extra: SolanaOperationExtra = {};
  if (!isExtraValid(extraRaw)) return extra;
  const solanaExtraRaw = extraRaw as SolanaOperationExtraRaw;

  if (solanaExtraRaw.memo) {
    extra.memo = solanaExtraRaw.memo;
  }

  if (solanaExtraRaw.stake) {
    extra.stake = {
      address: solanaExtraRaw.stake.address,
      amount: new BigNumber(solanaExtraRaw.stake.amount),
    };
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  const extraRaw: SolanaOperationExtraRaw = {};
  if (!isExtraValid(extra)) return extraRaw;
  const solanaExtra = extra as SolanaOperationExtra;

  if (solanaExtra.memo) {
    extraRaw.memo = solanaExtra.memo;
  }

  if (solanaExtra.stake) {
    extraRaw.stake = {
      address: solanaExtra.stake.address,
      amount: solanaExtra.stake.amount.toJSON(),
    };
  }

  return extraRaw;
}

function isExtraValid(extra: OperationExtra | OperationExtraRaw): boolean {
  return !!extra && typeof extra === "object";
}

export function assignToTokenAccountRaw(
  tokenAccount: TokenAccount,
  tokenAccountRaw: TokenAccountRaw,
) {
  const solanaTokenAccount = tokenAccount as SolanaTokenAccount;
  const solanaTokenAccountRaw = tokenAccountRaw as SolanaTokenAccountRaw;
  if (solanaTokenAccount.state) {
    solanaTokenAccountRaw.state = solanaTokenAccount.state;
  }
  if (solanaTokenAccount.extensions) {
    solanaTokenAccountRaw.extensions = JSON.stringify(solanaTokenAccount.extensions);
  }
}

export function assignFromTokenAccountRaw(
  tokenAccountRaw: TokenAccountRaw,
  tokenAccount: TokenAccount,
) {
  const solanaTokenAccount = tokenAccount as SolanaTokenAccount;
  const solanaTokenAccountRaw = tokenAccountRaw as SolanaTokenAccountRaw;
  if (solanaTokenAccountRaw.state) {
    solanaTokenAccount.state = solanaTokenAccountRaw.state;
  }
  if (solanaTokenAccountRaw.extensions) {
    solanaTokenAccount.extensions = JSON.parse(solanaTokenAccountRaw.extensions);
  }
}
