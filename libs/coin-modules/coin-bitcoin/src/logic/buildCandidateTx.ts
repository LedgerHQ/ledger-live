import BigNumber from "bignumber.js";
import BitcoinLikeWallet from "@ledgerhq/wallet-btc/wallet";
import { CoinSelect } from "@ledgerhq/wallet-btc/pickingstrategies/CoinSelect";
import type { Account as WalletBtcAccount } from "@ledgerhq/wallet-btc/account";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/types";
// wallet-btc's logging is injected; pass `@ledgerhq/logs` for now — becomes the ADR-019
// `context.log` once threaded through the Alpaca layer.
import { log } from "@ledgerhq/logs";

/**
 * Coin-select the account's UTXOs and build an unsigned transaction sending `amount` to
 * `recipient` at the given `feePerByte` rate (sat/vByte). Shared by `estimateFees` (reads
 * `txInfo.fee`) and `craftTransaction` (serializes `txInfo` into a PSBT), which resolve the rate
 * (network estimate or user override) and pass it in. The change output goes to a fresh internal
 * address. Uses the size-optimizing `CoinSelect` strategy.
 *
 * When `useAllAmount` is set, the send amount is the account's max spendable (whole balance minus
 * the sweep fee), matching the legacy `buildTransaction`: `amount = useAllAmount ? maxSpendable :
 * amount`. `buildTx` then produces a sweep — all UTXOs in, no (or dust) change. A fresh
 * `BitcoinLikeWallet` is used (never the `getWallet()` singleton); it only reads the passed account.
 */
export async function buildCandidateTx(
  account: WalletBtcAccount,
  recipient: string,
  amount: bigint,
  feePerByte: number,
  useAllAmount = false,
): Promise<TransactionInfo> {
  const spendAmount = useAllAmount
    ? await new BitcoinLikeWallet(log).estimateAccountMaxSpendable(
        account,
        feePerByte,
        [],
        [recipient],
      )
    : new BigNumber(amount.toString());
  const changeAddress = await account.xpub.getNewAddress(1, 1);
  const utxoPickingStrategy = new CoinSelect(
    account.xpub.crypto,
    account.xpub.derivationMode,
    [],
    log,
  );
  return account.xpub.buildTx({
    destAddress: recipient,
    amount: spendAmount,
    feePerByte,
    changeAddress,
    utxoPickingStrategy,
    sequence: 0,
  });
}
