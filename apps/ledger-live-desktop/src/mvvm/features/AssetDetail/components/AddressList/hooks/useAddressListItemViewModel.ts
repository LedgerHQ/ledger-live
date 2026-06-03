import { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector, localeSelector } from "~/renderer/reducers/settings";
import { useAccountName } from "~/renderer/reducers/wallet";
import { getCryptoAccountAddress } from "LLD/features/CryptoAddresses/utils/getCryptoAccountAddress";
import { useCounterValueCellViewModel } from "LLD/components/Cells/CounterValueCell/useCounterValueCellViewModel";

export type AddressListItemViewModel = Readonly<{
  displayName: string;
  formattedAddress: string;
  formattedCounterValue: string;
  cryptoFormatted: string;
  networkLedgerId: string;
  networkTicker: string;
  onClick: () => void;
  rowTestId: string;
}>;

export function useAddressListItemViewModel(
  account: AccountLike,
  lookupParentAccount: (id: string) => Account | undefined | null,
  onNavigate: (acc: AccountLike, parentAccount?: Account | null) => void,
): AddressListItemViewModel {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const currency = getAccountCurrency(account);
  const parentAccount =
    account.type === "TokenAccount" ? lookupParentAccount(account.parentId) : undefined;
  const networkCurrency =
    account.type === "TokenAccount"
      ? parentAccount?.currency ?? account.token.parentCurrency
      : currency;

  const accountForDisplayName =
    account.type === "TokenAccount"
      ? parentAccount ?? lookupParentAccount(account.parentId)
      : account;
  const displayName = useAccountName(accountForDisplayName ?? account);
  const rawAddress = getCryptoAccountAddress(account, lookupParentAccount);
  const formattedAddress = formatAddress(rawAddress, { prefixLength: 5, suffixLength: 5 });
  const { formattedCounterValue } = useCounterValueCellViewModel(currency, account.balance);
  const cryptoFormatted = formatCurrencyUnit(currency.units[0], account.balance, {
    locale,
    discreet,
    showCode: true,
  });

  const onClick = useCallback(() => {
    onNavigate(account, parentAccount);
  }, [account, onNavigate, parentAccount]);

  return {
    displayName,
    formattedAddress,
    formattedCounterValue,
    cryptoFormatted,
    networkLedgerId: networkCurrency.id,
    networkTicker: networkCurrency.ticker,
    onClick,
    rowTestId: `asset-detail-address-row-${account.id}`,
  };
}
