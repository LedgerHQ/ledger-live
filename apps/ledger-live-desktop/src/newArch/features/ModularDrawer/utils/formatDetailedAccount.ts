import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { formatAddress } from "LLD/utils/formatAddress";
import { getBalanceAndFiatValue } from "LLD/utils/getBalanceAndFiatValue";
import { Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";
import { isAccount } from "@ledgerhq/coin-framework/account/helpers";

/**
 *
 * @param account - The account to format
 * @param parentAddress - The address of the parent account
 * @param state - The current state of countervalues
 * @param to - The currency to convert to
 * @param discreet - Whether to format the balance in discreet mode
 * @returns An object containing the formatted account details
 */
export const formatDetailedAccount = (
  account: Account | TokenAccount,
  parentAddress: string,
  state: CounterValuesState,
  to: Currency,
  discreet?: boolean,
): DetailedAccount => {
  const isAnAccount = isAccount(account);
  const details = isAnAccount ? account.currency : account.token;
  const parentId = isAnAccount ? undefined : account.token.parentCurrency.id;

  const { id } = account;
  const { name, ticker, id: cryptoId } = details;

  const { balance, fiatValue } = getBalanceAndFiatValue(account, state, to, discreet);
  const address = formatAddress(parentAddress);

  return { name, id, ticker, balance, fiatValue, address, cryptoId, parentId };
};
