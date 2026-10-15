import invariant from "invariant";
import { getTransparentBalance } from "@ledgerhq/coin-zcash/logic/account/balance";
import { boundTransparentUtxos } from "@ledgerhq/coin-zcash/bridge/statusHelpers";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import type { AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { isZcashCurrencyId } from "../../bridge/zcashRouting";

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
  // A live app also sends in a single transaction, and one PCZT spends at most
  // the device's transparent-input ceiling. Summing the whole UTXO set would
  // offer an amount `getTransactionStatus` then rejects with ZcashSendTooLarge,
  // so the sum is bounded the same way a real send bounds its inputs
  // (`boundTransparentUtxos`, the largest ones). Up to the ceiling this is the
  // account page's "Transparent" figure; past it, the funds beyond it stay on
  // that page and in the send flow, they just cannot reach a live app at once.
  //
  // Summed from the UTXO set rather than derived from `balance`, whichever
  // module last wrote `balance`.
  getWalletApiSpendableBalance: account => {
    invariant(isZcashMainAccount(account), "zcash: invalid account in bridgeExtensions");

    return getTransparentBalance(boundTransparentUtxos(account.bitcoinResources?.utxos ?? []));
  },
};

export default extensions;
