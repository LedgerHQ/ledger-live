import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import wallet from "@ledgerhq/wallet-btc/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { zcashSafeFeePerByte } from "./fees";
import { resolveWalletAccount } from "./buildTransaction";

/**
 * Max spendable by a transparent send, priced at the rate that covers ZIP-317 for
 * any layout (the same rate the build starts from, so the two cannot disagree).
 */
export const buildLegacyEstimateMaxSpendable =
  (context: ZcashContext): AccountBridge<Transaction, ZcashAccount>["estimateMaxSpendable"] =>
  async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount) as ZcashAccount;
    const walletAccount = await resolveWalletAccount(context, mainAccount);
    const feePerByte = zcashSafeFeePerByte(
      walletAccount.xpub.crypto,
      walletAccount.xpub.derivationMode,
    );

    const maxSpendable = await wallet.estimateAccountMaxSpendable(
      walletAccount,
      feePerByte.toNumber(), //!\ wallet-btc handles fees as a JS number
      [],
      transaction?.recipient ? [transaction.recipient] : [],
    );

    return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
  };
