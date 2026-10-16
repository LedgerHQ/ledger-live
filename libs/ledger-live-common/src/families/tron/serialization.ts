import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { fromTronResourcesRaw, toTronResourcesRaw } from "@ledgerhq/coin-tron/types/serialization";
import { BigNumber } from "bignumber.js";
import {
  type TronAccount,
  type TronAccountRaw,
  type TrongridExtraTxInfo,
  type TrongridExtraTxInfoRaw,
} from "./types";

export { fromTronResourcesRaw, toTronResourcesRaw };

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const tronAccount = account as TronAccount;
  if (tronAccount.tronResources) {
    (accountRaw as TronAccountRaw).tronResources = toTronResourcesRaw(tronAccount.tronResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const tronResourcesRaw = (accountRaw as TronAccountRaw).tronResources;
  if (tronResourcesRaw)
    (account as TronAccount).tronResources = fromTronResourcesRaw(tronResourcesRaw);
}

/**
 * The staking amounts are `BigNumber`s on the operation (what the app renderers consume) and strings
 * once persisted. Every other key of `extra` is carried through untouched, so wiring these hooks
 * costs the rest of the bag nothing.
 *
 * Each amount is converted whenever it is present, rather than gated behind a whole-bag type guard:
 * a guard keyed on `frozenAmount`/`unfreezeAmount`/`votes` rejects an undelegate's extras, which
 * would then take the verbatim branch and persist a `BigNumber` as `{s,e,c}` for the renderers to
 * choke on.
 */
export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  if (extraRaw === null || typeof extraRaw !== "object") return extraRaw;
  const { frozenAmount, unfreezeAmount, unDelegatedAmount, ...rest } =
    extraRaw as TrongridExtraTxInfoRaw;

  return {
    ...rest,
    ...(frozenAmount !== undefined ? { frozenAmount: new BigNumber(frozenAmount) } : {}),
    ...(unfreezeAmount !== undefined ? { unfreezeAmount: new BigNumber(unfreezeAmount) } : {}),
    ...(unDelegatedAmount !== undefined
      ? { unDelegatedAmount: new BigNumber(unDelegatedAmount) }
      : {}),
  } satisfies TrongridExtraTxInfo;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  if (extra === null || typeof extra !== "object") return extra;
  const { frozenAmount, unfreezeAmount, unDelegatedAmount, ...rest } = extra as TrongridExtraTxInfo;

  return {
    ...rest,
    ...(frozenAmount !== undefined ? { frozenAmount: frozenAmount.toString() } : {}),
    ...(unfreezeAmount !== undefined ? { unfreezeAmount: unfreezeAmount.toString() } : {}),
    ...(unDelegatedAmount !== undefined ? { unDelegatedAmount: unDelegatedAmount.toString() } : {}),
  } satisfies TrongridExtraTxInfoRaw;
}
