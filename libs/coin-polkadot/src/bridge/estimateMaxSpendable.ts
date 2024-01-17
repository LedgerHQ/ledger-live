import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { PolkadotAccount, Transaction } from "../types";
import { calculateAmount } from "./logic";
import getEstimatedFees from "./getFeesForTransaction";
import createTransaction from "./createTransaction";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import { PolkadotAPI } from "../network";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
const estimateMaxSpendable =
  (polkadotAPI: PolkadotAPI) =>
  async ({
    account,
    parentAccount,
    transaction,
  }: {
    account: AccountLike;
    parentAccount: Account | null | undefined;
    transaction: Transaction | null | undefined;
  }): Promise<BigNumber> => {
    await loadPolkadotCrypto();
    const a = getMainAccount(account, parentAccount) as PolkadotAccount;
    const t = { ...createTransaction(), ...transaction, useAllAmount: true };
    const fees = await getEstimatedFees(polkadotAPI)({
      a,
      t,
    });
    return calculateAmount({
      a,
      t: { ...t, fees },
    });
  };

export default estimateMaxSpendable;
