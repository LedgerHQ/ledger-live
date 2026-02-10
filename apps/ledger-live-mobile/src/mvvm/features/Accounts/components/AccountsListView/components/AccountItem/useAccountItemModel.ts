import { getTagDerivationMode } from "@ledgerhq/coin-framework/lib/derivation";
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
}

const useAccountItemModel = ({
  account,
  balance,
  showUnit,
  hideBalanceInfo,
  withPlaceholder,
}: AccountItemProps) => {
  const allAccount = useSelector(accountsSelector);
  const isTokenAccount = isTokenAccountChecker(account);
  const currency = getAccountCurrency(account);
  const accountName = useMaybeAccountName(account);
  const unit = useMaybeAccountUnit(account);

  const parentAccount = getParentAccount(account, allAccount);
  const formattedAddress = formatAddress(
    isTokenAccount
      ? getFreshAccountAddress(parentAccount)
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
  };
};

export default useAccountItemModel;
