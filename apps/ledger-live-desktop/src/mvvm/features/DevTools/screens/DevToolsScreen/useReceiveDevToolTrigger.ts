import { useCallback, useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { ReceiveToolTrigger } from "@devtools/bindings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { useDeepLinkHandler } from "~/renderer/hooks/useDeeplinking/useDeepLinkHandler";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";

const SOURCE_PAGE = "DevTools";

export function useReceiveDevToolTrigger(): ReceiveToolTrigger {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const walletState = useSelector(walletSelector);
  const { handler: handleDeeplink } = useDeepLinkHandler();

  const entries = useMemo(
    () =>
      accounts.flatMap(parentAccount => [
        { account: parentAccount, parentAccount: undefined },
        ...(parentAccount.subAccounts ?? []).map(account => ({ account, parentAccount })),
      ]),
    [accounts],
  );

  const assets = useMemo(
    () =>
      entries.map(({ account, parentAccount }) => {
        const currency = getAccountCurrency(account);
        return {
          id: account.id,
          label: accountNameWithDefaultSelector(walletState, account),
          ticker: currency.ticker,
          currencyId: currency.id,
          network: (parentAccount?.currency ?? currency).name,
          networkId: parentAccount?.currency.id,
        };
      }),
    [entries, walletState],
  );

  const onReceive = useCallback(
    (accountId: string) => {
      const entry = entries.find(({ account }) => account.id === accountId);
      if (entry) dispatch(openModal("MODAL_RECEIVE", { ...entry, sourcePage: SOURCE_PAGE }));
    },
    [entries, dispatch],
  );

  const onPickAsset = useCallback(
    () => dispatch(openModal("MODAL_RECEIVE", { sourcePage: SOURCE_PAGE })),
    [dispatch],
  );

  const onOpenDeeplink = useCallback((url: string) => handleDeeplink(url, false), [handleDeeplink]);

  return useMemo(
    () => ({ assets, onReceive, onPickAsset, onOpenDeeplink }),
    [assets, onReceive, onPickAsset, onOpenDeeplink],
  );
}
