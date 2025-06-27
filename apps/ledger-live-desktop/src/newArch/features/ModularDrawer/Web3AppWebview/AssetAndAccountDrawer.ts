import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import type {
  ModularDrawerConfiguration,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";
import { type CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "~/renderer/drawers/Provider";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { type WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { CloseButton } from "../components/CloseButton";

type Result = {
  account: AccountLike;
  parentAccount?: Account;
};

type DrawerParams = {
  source: string;
  flow: string;
  assetIds?: string[];
  currencies?: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
  includeTokens?: boolean;
  drawerConfiguration?: ModularDrawerConfiguration | EnhancedModularDrawerConfiguration;
  onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  onCancel?: () => void;
};

function openAssetAndAccountDrawer(params: DrawerParams): void {
  const {
    assetIds,
    currencies,
    accounts$,
    includeTokens,
    drawerConfiguration,
    onSuccess,
    onCancel,
  } = params;

  const modularDrawerConfiguration = createModularDrawerConfiguration(drawerConfiguration);

  const handleSuccess = (result: Result): void => {
    setDrawer();
    onSuccess?.(result.account, result.parentAccount);
  };

  const handleCancel = (): void => {
    track("button_clicked", {
      button: "Close",
      flow: params.flow,
      page: currentRouteNameRef.current,
    });
    setDrawer();
    onCancel?.();
  };

  const filteredCurrencies =
    currencies ?? listAndFilterCurrencies({ currencies: assetIds, includeTokens });

  return setDrawer(
    ModularDrawerFlowManager,
    {
      currencies: filteredCurrencies,
      accounts$,
      onAccountSelected: (account, parentAccount) => {
        handleSuccess({ account, parentAccount });
      },
      drawerConfiguration: modularDrawerConfiguration,
      source: params.source,
      flow: params.flow,
    },
    {
      closeButtonComponent: CloseButton,
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
