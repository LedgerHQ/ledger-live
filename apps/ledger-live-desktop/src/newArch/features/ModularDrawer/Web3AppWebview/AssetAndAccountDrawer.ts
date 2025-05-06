import { Account, AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "~/renderer/drawers/Provider";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { SelectAccountFlow } from "../components/SelectAccountFlow";

type Result = {
  account: AccountLike;
  parentAccount?: Account;
};

type DrawerParams = {
  assetIds?: string[];
  currencies?: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
  includeTokens?: boolean;
  onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  onCancel?: () => void;
};

function openAssetAndAccountDrawer(params: DrawerParams): void {
  const { assetIds, currencies, accounts$, includeTokens } = params;

  const handleSuccess = (result: Result): void => {
    setDrawer();
    params.onSuccess?.(result.account, result.parentAccount);
  };

  const handleCancel = (): void => {
    setDrawer();
    params.onCancel?.();
  };

  const filteredCurrencies =
    currencies ?? listAndFilterCurrencies({ currencies: assetIds, includeTokens });

  return setDrawer(
    SelectAccountFlow,
    {
      currencies: filteredCurrencies,
      accounts$,
      onAccountSelected: (account, parentAccount) => {
        handleSuccess({ account, parentAccount });
      },
    },
    {
      onRequestClose: handleCancel,
    },
  );
}

function openAssetAndAccountDrawerPromise(
  drawerParams: Omit<DrawerParams, "onSuccess" | "onCancel">,
) {
  return new Promise<Result>((resolve, reject) =>
    openAssetAndAccountDrawer({
      ...drawerParams,
      onSuccess: (account, parentAccount) => resolve({ account, parentAccount }),
      onCancel: () => reject(new Error("Canceled by user")),
    }),
  );
}

export { openAssetAndAccountDrawerPromise, openAssetAndAccountDrawer };
