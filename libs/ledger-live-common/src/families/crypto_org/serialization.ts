import { BigNumber } from "bignumber.js";
import type {
  CryptoOrgResourcesRaw,
  CryptoOrgResources,
  CryptoOrgAccountRaw,
  CryptoOrgAccount,
} from "./types";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

export function toCryptoOrgResourcesRaw(
  r: CryptoOrgResources
): CryptoOrgResourcesRaw {
  const { bondedBalance, redelegatingBalance, unbondingBalance, commissions } =
    r;
  return {
    bondedBalance: bondedBalance.toString(),
    redelegatingBalance: redelegatingBalance.toString(),
    unbondingBalance: unbondingBalance.toString(),
    commissions: commissions.toString(),
  };
}
export function fromCryptoOrgResourcesRaw(
  r: CryptoOrgResourcesRaw
): CryptoOrgResources {
  const { bondedBalance, redelegatingBalance, unbondingBalance, commissions } =
    r;
  return {
    bondedBalance: new BigNumber(bondedBalance),
    redelegatingBalance: new BigNumber(redelegatingBalance),
    unbondingBalance: new BigNumber(unbondingBalance),
    commissions: new BigNumber(commissions),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const crytpoOrgAccount = account as CryptoOrgAccount;
  if (crytpoOrgAccount.cryptoOrgResources) {
    (accountRaw as CryptoOrgAccountRaw).cryptoOrgResources =
      toCryptoOrgResourcesRaw(crytpoOrgAccount.cryptoOrgResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const cryptoOrgResourcesRaw = (accountRaw as CryptoOrgAccountRaw)
    .cryptoOrgResources;
  if (cryptoOrgResourcesRaw)
    (account as CryptoOrgAccount).cryptoOrgResources =
      fromCryptoOrgResourcesRaw(cryptoOrgResourcesRaw);
}
