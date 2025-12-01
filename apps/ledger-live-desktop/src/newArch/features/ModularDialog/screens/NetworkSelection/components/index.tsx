import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createNetworkConfigurationHook } from "@ledgerhq/live-common/modularDrawer/modules/createNetworkConfiguration";
import { accountsCount } from "../../../components/AccountCount";
import { accountsCountAndApy } from "../../../components/AccountCountApy";
import { balanceItem } from "../../../components/Balance";
import { useAccountData } from "../../../hooks/useAccountData";
import { useBalanceDeps } from "../../../hooks/useBalanceDeps";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import styled from "styled-components";

type SelectNetworkProps = {
  networks?: CryptoOrTokenCurrency[];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  selectedAssetId?: string;
};

const TITLE_HEIGHT = 52;
const LIST_HEIGHT = `calc(100% - ${TITLE_HEIGHT}px)`;

const ScrollableContainer = styled.div`
  height: ${LIST_HEIGHT};
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 0 8px;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--colors-content-subdued-default-default);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--colors-content-default-default);
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TrailingContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SelectNetwork = ({
  networks,
  onNetworkSelected,
  networksConfig,
  selectedAssetId,
}: SelectNetworkProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const networkConfigurationDeps = {
    useAccountData,
    accountsCount,
    accountsCountAndApy,
    useBalanceDeps,
    balanceItem,
  };

  const makeNetworkConfigurationHook = createNetworkConfigurationHook(networkConfigurationDeps);

  const transformNetworks = makeNetworkConfigurationHook({
    networksConfig,
  });

  const formattedNetworks = networks && networks.length > 0 ? transformNetworks(networks) : [];

  if (!networks || networks.length === 0 || !selectedAssetId) {
    return null;
  }

  const handleClick = (networkId: string) => {
    const network = formattedNetworks.find(network =>
      network.type === "CryptoCurrency"
        ? network.id === networkId
        : network.parentCurrency.id === networkId,
    );

    if (!network) return;

    trackModularDrawerEvent(
      "network_clicked",
      {
        network: network.name,
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
      },
      {
        formatNetworkConfig: true,
        networksConfig,
      },
    );

    onNetworkSelected(network);
  };

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <ScrollableContainer>
        <ListContainer>
          {formattedNetworks.map(network => {
            const networkId =
              network.type === "CryptoCurrency" ? network.id : network.parentCurrency.id;
            
            // Build description
            const descriptionParts: string[] = [];
            if (network.ticker) {
              descriptionParts.push(network.ticker);
            }
            const description = descriptionParts.join(" · ");

            return (
              <ListItem
                key={networkId}
                title={network.name}
                description={description || network.ticker}
                leadingContent={
                  <IconWrapper>
                    <CryptoCurrencyIcon currency={network} size={32} />
                  </IconWrapper>
                }
                trailingContent={
                  <TrailingContent>
                    {network.rightElement}
                  </TrailingContent>
                }
                onClick={() => handleClick(networkId)}
              />
            );
          })}
        </ListContainer>
      </ScrollableContainer>
    </ListWrapper>
  );
};
