import invariant from "invariant";
import { getTransparentBalance } from "@ledgerhq/coin-zcash/logic/account/balance";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import type { AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";

// Deliberately not `isZcashAccount` from the coin module: that guard requires a
// `privateInfo` key, which an account whose shielded sync was never activated
// does not carry -- and such an account is exactly the one this extension must
// still answer for.
const isZcashMainAccount = (account: AccountLike): account is ZcashAccount =>
  account.type === "Account" && account.currency.id === "zcash";

const extensions: AccountBridgeExtensions = {
  // A live app (swap, buy/sell, a dApp) can only ever move transparent funds:
  // the transaction it hands over carries no pool selection, so
  // `updateTransaction` derives a transparent-input transfer type and
  // `estimateMaxSpendable` caps on the transparent UTXO set. Reporting the
  // account's `spendableBalance` here -- transparent + private, which the send
  // flow legitimately offers -- would let those apps display, and offer as MAX,
  // funds they cannot spend, failing only once an amount is entered.
  //
  // Summed from the UTXO set rather than derived from `balance`, so it stays the
  // same figure as the account page's "Transparent" label and as the transparent
  // branch of `estimateMaxSpendable`, whichever module last wrote `balance`.
  getWalletApiSpendableBalance: account => {
    invariant(isZcashMainAccount(account), "zcash: invalid account in bridgeExtensions");

    return getTransparentBalance(account.bitcoinResources?.utxos);
  },
};

export default extensions;
