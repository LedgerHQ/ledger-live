import BigNumber from "bignumber.js";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import wallet from "@ledgerhq/wallet-btc/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { marginalFeeFor } from "../logic/coin-selection";
import { zcashSafeFeePerByte } from "./fees";
import { resolveWalletAccount } from "./buildTransaction";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";
import { resolveFilteredPool } from "../bridge/estimateMaxSpendable";
import { TRANSPARENT_POOL } from "../bridge/accountBalances";
import { pendingSpentInputs } from "../bridge/statusHelpers";

/**
 * Max spendable by a transparent send, priced at the rate that covers ZIP-317 for
 * any layout (the same rate the build starts from, so the two cannot disagree).
 *
 * With filters, only the transparent pool can fund the send while the shielded engine is off, and
 * the outputs pending operations already spend are left out.
 */
export const buildLegacyEstimateMaxSpendable =
  (context: ZcashContext): AccountBridge<Transaction, ZcashAccount>["estimateMaxSpendable"] =>
  async ({ account, parentAccount, transaction, filters }) => {
    const mainAccount = getMainAccount(account, parentAccount) as ZcashAccount;
    const pool = filters && resolveFilteredPool(filters);
    if (pool !== undefined && pool !== TRANSPARENT_POOL) {
      throw new UnsupportedMaxSpendableFilter(`Pool "${pool}" cannot fund a transparent-only send`);
    }
    const walletAccount = await resolveWalletAccount(context, mainAccount);
    const { zip2009 } = await context.config(mainAccount.currency.id);
    const feePerByte = zcashSafeFeePerByte(
      walletAccount.xpub.crypto,
      walletAccount.xpub.derivationMode,
      marginalFeeFor(mainAccount, zip2009),
    );

    const maxSpendable = await wallet.estimateAccountMaxSpendable(
      context.logger,
      walletAccount,
      feePerByte.toNumber(), //!\ wallet-btc handles fees as a JS number
      pool === TRANSPARENT_POOL ? pendingSpentInputs(mainAccount) : [],
      transaction?.recipient ? [transaction.recipient] : [],
    );

    return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
  };
