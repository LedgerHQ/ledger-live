import { BigNumber } from "bignumber.js";
import wallet, { Merge, type Account as WalletAccount } from "@ledgerhq/wallet-btc/index";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { ZcashContext } from "../config";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { bindExplorer } from "../bridge/explorer";
import { getWalletAccount } from "../bridge/getWalletAccount";
import { resolveTransparentUtxos } from "../bridge/statusHelpers";
import { ZcashPreparedBuildMismatch } from "../types/errors";
import { selectTransparentInputs } from "../logic/coin-selection";
import { FixedSelection } from "./fixedSelection";
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
  marginalFee: number,
): Promise<PricedBuild> {
  return buildAtZip317Rate(
    zcashSafeFeePerByte(walletAccount.xpub.crypto, walletAccount.xpub.derivationMode, marginalFee),
    marginalFee,
    feePerByte => buildAtRate(logger, walletAccount, transaction, feePerByte),
  );
}

/**
 * Builds the transaction the prepare step priced: the same inputs, fee, amount
 * and change, instead of wallet-btc's own selection. The device then signs what
 * the user reviewed. Refuses (rather than sign something else) when the build
 * cannot reproduce it. `marginalFee` is the ZIP-317 marginal fee the prepare
 * step priced at.
 */
export async function buildPreparedLegacyTransaction(
  logger: Logger,
  walletAccount: WalletAccount,
  account: ZcashAccount,
  transaction: Transaction,
  marginalFee: number,
): Promise<TransactionInfo> {
  const { zcashFee, recipient, amount } = transaction;
  if (!zcashFee) throw new ZcashPreparedBuildMismatch();
  const changeAmount = transaction.changeAmount ?? new BigNumber(0);

  // The inputs are read from the account as it is now, and a sync may have
  // changed them since the review. Re-price them: a different input count calls
  // for a different ZIP-317 fee, and a different total for a different change.
  const utxos = resolveTransparentUtxos(account, transaction);
  const repriced = selectTransparentInputs(
    utxos.map(utxo => utxo.value),
    amount,
    !!transaction.useAllAmount,
    transaction.transferType,
    marginalFee,
  );
  if (
    !repriced ||
    !repriced.fee.eq(zcashFee) ||
    !repriced.totalInput.minus(amount).minus(zcashFee).eq(changeAmount)
  ) {
    throw new ZcashPreparedBuildMismatch();
  }

  const outpoints = utxos.map(utxo => ({
    hash: utxo.hash,
    outputIndex: utxo.outputIndex,
  }));
  const { crypto, derivationMode } = walletAccount.xpub;
  // The strategy ignores the rate; the type still asks for one.
  const feePerByte = zcashSafeFeePerByte(crypto, derivationMode, marginalFee).toNumber();

  const txInfo = await walletAccount.xpub.buildTx(logger, {
    destAddress: recipient,
    amount,
    feePerByte,
    changeAddress: await walletAccount.xpub.getNewAddress(1, 1),
    utxoPickingStrategy: new FixedSelection(
      crypto,
      derivationMode,
      outpoints,
      zcashFee,
      changeAmount.gt(0),
    ),
    sequence: SEQUENCE_FINAL,
  });

  // wallet-btc folds a below-dust change into the fee, where the reviewed
  // selection kept it as change: the fee on screen would not be the one signed.
  const sum = (isChange: boolean) =>
    txInfo.outputs
      .filter(output => !!output.isChange === isChange)
      .reduce((total, output) => total.plus(output.value), new BigNumber(0));
  if (
    !new BigNumber(txInfo.fee).eq(zcashFee) ||
    !sum(false).eq(amount) ||
    !sum(true).eq(changeAmount)
  ) {
    throw new ZcashPreparedBuildMismatch();
  }
  return txInfo;
}
