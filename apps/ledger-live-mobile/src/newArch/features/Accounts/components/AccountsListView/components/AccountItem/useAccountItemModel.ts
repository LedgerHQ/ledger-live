import { getTagDerivationMode } from "@ledgerhq/coin-framework/lib/derivation";
import {
  getParentAccount,
  isTokenAccount as isTokenAccountChecker,
} from "@ledgerhq/live-common/account/index";
import { Account, DerivationMode, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import { formatAddress } from "~/newArch/features/Accounts/utils/formatAddress";
import { accountsSelector } from "~/reducers/accounts";
import { useMaybeAccountName } from "~/reducers/wallet";

export interface AccountItemProps {
  account: Account | TokenAccount;
  balance: BigNumber;
}

const useAccountItemModel = ({ account, balance }: AccountItemProps) => {
  const allAccount = useSelector(accountsSelector);
  const isTokenAccount = isTokenAccountChecker(account);
  const currency = isTokenAccount ? account.token.parentCurrency : account.currency;
  const accountName = useMaybeAccountName(account);
  const parentAccount = getParentAccount(account, allAccount);
  const formattedAddress = formatAddress(
    isTokenAccount ? parentAccount.freshAddress : account.freshAddress,
  );
  const tag =
    account.type === "Account" &&
    account?.derivationMode !== undefined &&
    account?.derivationMode !== null &&
    currency.type === "CryptoCurrency" &&
    getTagDerivationMode(currency, account.derivationMode as DerivationMode);

  return {
    balance,
    accountName,
    formattedAddress,
    tag,
    currency,
  };
};

export default useAccountItemModel;
