import { BigNumber } from "bignumber.js";
import wallet, { Merge, type Account as WalletAccount } from "@ledgerhq/wallet-btc/index";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { ZcashContext } from "../config";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { bindExplorer } from "../bridge/explorer";
import { getWalletAccount } from "../bridge/getWalletAccount";
import { buildAtZip317Rate, zcashSafeFeePerByte, type PricedBuild } from "./fees";

// Non-final: the sequence a send that is not replaceable carries.
const SEQUENCE_FINAL = 0xffffffff;

/**
 * The account's wallet-btc engine, pointed at the explorer the coin config
 * names (a deserialized account carries none until it is bound).
 */
export async function resolveWalletAccount(
  context: ZcashContext,
  account: ZcashAccount,
  currency: CryptoCurrency = account.currency,
): Promise<WalletAccount> {
  const config = await context.config(currency.id);
  return bindExplorer(getWalletAccount(account), currency, config);
}

/**
 * Selects the inputs and the change of a transparent send with wallet-btc, as
 * coin-bitcoin does. Zcash spends P2PKH only: no RBF, no custom picking.
 */
async function buildAtRate(
  logger: Logger,
  walletAccount: WalletAccount,
  transaction: Transaction,
  feePerByte: BigNumber,
): Promise<TransactionInfo> {
  const { recipient, useAllAmount } = transaction;
  const rate = feePerByte.toNumber(); //!\ wallet-btc handles fees as a JS number

  const amount = useAllAmount
    ? await wallet.estimateAccountMaxSpendable(logger, walletAccount, rate, [], [recipient])
    : transaction.amount;

  return walletAccount.xpub.buildTx(logger, {
    destAddress: recipient,
    amount,
    feePerByte: rate,
    changeAddress: await walletAccount.xpub.getNewAddress(1, 1),
    utxoPickingStrategy: new Merge(
      walletAccount.xpub.crypto,
      walletAccount.xpub.derivationMode,
      [],
    ),
    sequence: SEQUENCE_FINAL,
  });
}

/** Builds the transaction at the rate that makes it pay exactly what ZIP-317 asks. */
export function buildLegacyTransaction(
  logger: Logger,
  walletAccount: WalletAccount,
  transaction: Transaction,
): Promise<PricedBuild> {
  return buildAtZip317Rate(
    zcashSafeFeePerByte(walletAccount.xpub.crypto, walletAccount.xpub.derivationMode),
    feePerByte => buildAtRate(logger, walletAccount, transaction, feePerByte),
  );
}
