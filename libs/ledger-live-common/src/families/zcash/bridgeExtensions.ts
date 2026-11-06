import invariant from "invariant";
import { getAddressesToWatch } from "@ledgerhq/coin-zcash/bridge/addressesToWatch";
import { getTransparentBalance } from "@ledgerhq/coin-zcash/logic/account/balance";
import { boundTransparentUtxos } from "@ledgerhq/coin-zcash/bridge/statusHelpers";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import type { AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { isZcashCurrencyId, isZcashShieldedEnabled } from "../../bridge/zcashRouting";

// Deliberately not `isZcashAccount` from the coin module: that guard requires a
// `privateInfo` key, which an account whose shielded sync was never activated
// does not carry -- and such an account is exactly the one this extension must
// still answer for.
const isZcashMainAccount = (account: AccountLike): account is ZcashAccount =>
  account.type === "Account" && isZcashCurrencyId(account.currency.id);

const extensions: AccountBridgeExtensions = {
  // A live app (swap, buy/sell, a dApp) can only ever move transparent funds:
  // the transaction it hands over carries no pool selection, so
  // `updateTransaction` derives a transparent-input transfer type and
  // `estimateMaxSpendable` caps on the transparent UTXO set. Reporting the
  // account's `spendableBalance` here -- transparent + private, which the send
  // flow legitimately offers -- would let those apps display, and offer as MAX,
  // funds they cannot spend, failing only once an amount is entered.
  //
  // A live app also sends in a single transaction. With the shielded engine on,
  // that transaction is a PCZT, which spends at most the device's
  // transparent-input ceiling: summing the whole UTXO set would offer an amount
  // `getTransactionStatus` then rejects with ZcashSendTooLarge, so the sum is
  // bounded the same way a real send bounds its inputs (`boundTransparentUtxos`,
  // the largest ones). Past the ceiling, the funds beyond it stay on the account
  // page and in the send flow, they just cannot reach a live app at once. The
  // transparent-only path (shielded engine off) signs with no such ceiling, so
  // it reports the whole UTXO set.
  //
  // Summed from the UTXO set rather than derived from `balance`, whichever
  // module last wrote `balance`.
  getWalletApiSpendableBalance: account => {
    invariant(isZcashMainAccount(account), "zcash: invalid account in bridgeExtensions");

    const utxos = account.bitcoinResources?.utxos ?? [];
    return getTransparentBalance(isZcashShieldedEnabled() ? boundTransparentUtxos(utxos) : utxos);
  },
  getAddressesToWatch,
};

export default extensions;
