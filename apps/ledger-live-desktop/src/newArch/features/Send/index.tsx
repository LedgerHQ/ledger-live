import React, { useCallback, useState } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useModularDrawerData } from "~/newArch/features/ModularDrawer/hooks/useModularDrawerData";
import { useAssetSelection } from "~/newArch/features/ModularDrawer/hooks/useAssetSelection";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import SelectAssetStep from "./screens/SelectAsset";
import SelectNetworkStep from "./screens/SelectNetwork";
import SelectAccountStep from "./screens/SelectAccount";
import { SEND_STEP } from "./domain";
import { useSendNavigation } from "./hooks/useSendNavigation";

// Props are intentionally minimal: "params" allows preselecting an account when the flow is opened
// from an account page, otherwise we start from the asset selection step.
type Props = Readonly<{
  onClose?: () => void;
  params?: {
    account?: AccountLike;
    parentAccount?: Account;
  };
}>;

export default function SendWorkflow({ onClose, params }: Props) {
  const preselectedAccount = params?.account ?? null;
  const preselectedParentAccount = params?.parentAccount;
  const preselectedAsset = preselectedAccount ? getAccountCurrency(preselectedAccount) : null;

  const { step, shouldShowNetworkStep, goToAsset, goToNetwork, goToAccount, goToSend } =
    useSendNavigation(!!preselectedAccount);
  const [selectedAsset, _setSelectedAsset] = useState<CryptoOrTokenCurrency | null>(
    preselectedAsset,
  );
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountLike | null>(preselectedAccount);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedParentAccount, setSelectedParentAccount] = useState<Account | undefined>(
    preselectedParentAccount,
  );

  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      setSelectedAccount(account);
      setSelectedParentAccount(parentAccount);
      goToSend();
    },
    [goToSend],
  );

  // Reuse the Modular Drawer data pipeline so we get the same asset list, ordering, search,
  // and pagination behavior as the existing drawer-based flows.
  const { sortedCryptoCurrencies, error, refetch, loadingStatus, loadNext, assetsSorted } =
    useModularDrawerData({
      useCase: undefined, // useCase is intentionally undefined for now, to reuse generic asset behavior
    });

  const { assetsToDisplay } = useAssetSelection([], sortedCryptoCurrencies);

  const { assetsConfiguration, networkConfiguration } = useModularDrawerConfiguration(
    "lldModularDrawer",
    {
      assets: { leftElement: "undefined", rightElement: "balance", filter: "undefined" },
      networks: { leftElement: "undefined", rightElement: "undefined" },
    },
  );

  if (step === SEND_STEP.ASSET) {
    return (
      <SelectAssetStep
        assetsToDisplay={assetsToDisplay}
        loadingStatus={loadingStatus}
        assetsConfiguration={assetsConfiguration}
        assetsSorted={assetsSorted}
        loadNext={loadNext}
        error={!!error}
        refetch={refetch}
        onClose={onClose}
        onBack={onClose}
        onAssetSelected={asset => {
          _setSelectedAsset(asset);

          const matchingAsset = assetsSorted?.find(assetData =>
            assetData.networks.some(network => network.id === asset.id),
          );

          const networks = matchingAsset?.networks ?? [];

          if (networks.length > 1) {
            setSelectedNetwork(null);
            goToNetwork();
          } else if (networks.length === 1) {
            setSelectedNetwork(networks[0]);
            goToAccount({ viaNetwork: false });
          } else {
            setSelectedNetwork(null);
            goToAccount({ viaNetwork: false });
          }
        }}
      />
    );
  }

  if (step === SEND_STEP.NETWORK && selectedAsset) {
    const matchingAsset = assetsSorted?.find(assetData =>
      assetData.networks.some(network => network.id === selectedAsset.id),
    );

    const networks = matchingAsset?.networks ?? [];

    return (
      <SelectNetworkStep
        networks={networks}
        networksConfiguration={networkConfiguration}
        selectedAssetId={selectedAsset.id}
        onNetworkSelected={network => {
          setSelectedNetwork(network);
          goToAccount({ viaNetwork: true });
        }}
        onClose={onClose}
        onBack={goToAsset}
      />
    );
  }

  const accountAsset = selectedNetwork ?? selectedAsset;

  if (step === SEND_STEP.ACCOUNT && accountAsset) {
    return (
      <SelectAccountStep
        asset={accountAsset}
        onAccountSelected={handleAccountSelected}
        onClose={onClose}
        onBack={() => {
          if (shouldShowNetworkStep) {
            goToNetwork();
          } else {
            goToAsset();
          }
        }}
      />
    );
  }

  if (step === SEND_STEP.RECIPIENT) {
    return (
      <div style={{ margin: "auto", textAlign: "center", padding: "40px" }}>
        <p>New Send flow</p>
        <p>Asset: {selectedAsset?.name}</p>
        <p>Account: {selectedAccount?.id}</p>
        <p>Still under construction</p>
      </div>
    );
  }

  return null;
}
