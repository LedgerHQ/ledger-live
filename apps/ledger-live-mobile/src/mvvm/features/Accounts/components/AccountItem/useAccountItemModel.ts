import { getTagDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import {
  getAccountCurrency,
  getParentAccount,
  isTokenAccount as isTokenAccountChecker,
} from "@ledgerhq/live-common/account/index";
import { Account, DerivationMode, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useSelector } from "~/context/hooks";
import { useMaybeAccountUnit } from "~/hooks";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { accountsSelector } from "~/reducers/accounts";
import { useMaybeAccountName } from "~/reducers/wallet";
import { getFreshAccountAddress } from "~/utils/address";

export interface AccountItemProps {
  account: Account | TokenAccount;
  balance: BigNumber;
  showUnit?: boolean;
  hideBalanceInfo?: boolean;
  withPlaceholder?: boolean;
  squaredIcon?: boolean;
  /** Parent account for token rows. Pass it from the list level to avoid a
   * per-row `accountsSelector` subscription and O(N) find. */
  parentAccount?: Account;
}

export const useAccountItemModelHook = ({
  account,
  balance,
  showUnit,
  hideBalanceInfo,
  withPlaceholder,
  squaredIcon,
  parentAccount,
}: AccountItemProps) => {
  const isTokenAccount = isTokenAccountChecker(account);
  const currency = getAccountCurrency(account);
  const accountName = useMaybeAccountName(account);
  const unit = useMaybeAccountUnit(account);

  // Unconditional subscription (react rules-of-hooks): when the caller passes
  // the parent (AccountsListView), we skip the O(N) getParentAccount find, so
  // the scan is eliminated even though the subscription is always made.
  // ponytail: one selector subscription per row remains — a ref compare, not a
  // scan. Upgrade path: migrate the other AccountItem call sites to pass
  // parentAccount and lift the subscription out of the row entirely.
  const allAccount = useSelector(accountsSelector);
  const resolvedParentAccount =
    parentAccount ?? (allAccount && getParentAccount(account, allAccount));

  const formattedAddress = formatAddress(
    isTokenAccount
      ? getFreshAccountAddress(resolvedParentAccount)
      : getFreshAccountAddress(account as Account),
  );
  const tag =
    account.type === "Account" &&
    account?.derivationMode !== undefined &&
    account?.derivationMode !== null &&
    currency.type === "CryptoCurrency" &&
    getTagDerivationMode(currency, account.derivationMode as DerivationMode);

  const accountId = account.id;

  return {
    balance,
    accountName,
    formattedAddress,
    tag,
    currency,
    unit,
    showUnit,
    hideBalanceInfo,
    withPlaceholder,
    accountId,
    squaredIcon,
  };
};

const useAccountItemModel = (props: AccountItemProps) => useAccountItemModelHook(props);

export default useAccountItemModel;
