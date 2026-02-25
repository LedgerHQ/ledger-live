import { useCallback, useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import orderBy from "lodash/orderBy";
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useModularDrawerAnalytics, MODULAR_DRAWER_PAGE_NAME } from "../analytics";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import {
  getAccountTuplesForCurrency,
  AccountTuple,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { ExtendedRawDetailedAccount } from "@ledgerhq/live-common/modularDrawer/types/detailedAccount";
import { useDetailedAccountsCore } from "@ledgerhq/live-common/modularDrawer/hooks/useDetailedAccountsCore";

// Mobile-specific detailed account type that includes formatted strings for UI
export type RawDetailedAccount = Omit<ExtendedRawDetailedAccount, "fiatValue" | "balance"> & {
  fiatValue: string; // Formatted fiat value string
  balance: string; // Formatted balance string
};

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  flow: string,
  source: string,
  onAccountSelected: ((account: AccountLike, parentAccount?: AccountLike) => void) | undefined,
) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const counterValuesState = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const nestedAccounts = useSelector(accountsSelector);
  const discreet = useSelector(discreetModeSelector);

  const isATokenCurrency = useMemo(() => isTokenCurrency(asset), [asset]);

  const accounts = useMemo(() => {
    const accountTuples = getAccountTuplesForCurrency(asset, nestedAccounts);
    return orderBy(accountTuples, [(tuple: AccountTuple) => tuple.account.balance], ["desc"]);
  }, [asset, nestedAccounts]);

  const overridedAccountName = useBatchMaybeAccountName(accounts.map(({ account }) => account));

  // Use the shared core hook for detailed accounts logic
  const { createExtendedDetailedAccounts } = useDetailedAccountsCore(
    counterValuesState,
    counterValueCurrency,
  );

  const detailedAccounts = useMemo((): RawDetailedAccount[] => {
    const accountNameMap: Record<string, string> = {};
    for (const [index, { account }] of accounts.entries()) {
      const name = overridedAccountName[index];
      if (name) {
        accountNameMap[account.id] = name;
      }
    }

    // Get the base extended detailed accounts from shared logic
    const extendedAccounts = createExtendedDetailedAccounts({
      asset,
      accountTuples: accounts,
      accountNameMap,
      isTokenCurrency: isATokenCurrency,
    });

    // Add mobile-specific formatting for fiat value and balance
    return extendedAccounts.map((extendedAccount): RawDetailedAccount => {
      const { account, parentAccount } = extendedAccount;
      // Get address from account, fallback to extendedAccount address
      const accountAddress =
        account.type === "Account" ? account.freshAddress : extendedAccount.address;
      const address = formatAddress(accountAddress);

      const fiatValue = formatCurrencyUnit(
        counterValueCurrency.units[0],
        BigNumber(extendedAccount.fiatValue),
        { showCode: true, discreet },
      );

      const balance = formatCurrencyUnit(extendedAccount.balanceUnit, extendedAccount.balance, {
        showCode: true,
        discreet,
      });

      return {
        id: extendedAccount.id,
        name: extendedAccount.name,
        ticker: extendedAccount.ticker,
        balance: balance, // Formatted string for mobile UI
        balanceUnit: extendedAccount.balanceUnit,
        fiatValue: fiatValue, // Formatted string for mobile UI
        address,
        cryptoId: extendedAccount.cryptoId,
        parentId: extendedAccount.parentId,
        account,
        parentAccount,
        protocol: extendedAccount.protocol,
      };
    });
  }, [
    accounts,
    overridedAccountName,
    isATokenCurrency,
    counterValueCurrency.units,
    discreet,
    createExtendedDetailedAccounts,
    asset,
  ]);

  const handleAccountSelected = useCallback(
    (rawAccount: RawDetailedAccount) => {
      trackModularDrawerEvent("account_clicked", {
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
        flow,
        source,
        currency: asset.ticker,
      });

      onAccountSelected?.(rawAccount.account, rawAccount.parentAccount);
    },
    [trackModularDrawerEvent, flow, source, asset.ticker, onAccountSelected],
  );

  return { detailedAccounts, accounts, handleAccountSelected };
};
