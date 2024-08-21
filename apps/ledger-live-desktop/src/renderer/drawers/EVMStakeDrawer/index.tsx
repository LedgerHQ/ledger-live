import React, { useCallback, useMemo, useState } from "react";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { Chip, Flex, Text } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { EthStakingModalBody } from "~/renderer/families/evm/StakeFlowModal/EthStakingModalBody";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { setDrawer } from "../Provider";

type Props = {
  account: Account;
  singleProviderRedirectMode?: boolean;
  /** Analytics source */
  source?: string;
  hasCheckbox?: boolean;
};

const EVMStakingDrawer = ({ account, hasCheckbox, singleProviderRedirectMode, source }: Props) => {
  const ethStakingProviders = useFeature("ethStakingProviders");
  const providers = ethStakingProviders?.params?.listProvider;

  const providersByCategory: ProvidersByFilter = useMemo(
    () =>
      (providers || [])?.reduce(
        (acc, provider) => {
          console.log("provider", provider);
          // Push all into staking category
          acc["staking"].push(provider);

          if (provider.queryParams?.restake) {
            // TODO: Add this query param data in Firebase
            acc["restaking"].push(provider);
          }
          return acc as ProvidersByFilter;
        },
        { staking: [], restaking: [] } as ProvidersByFilter,
      ),
    [providers],
  );

  const { activeKey, changeTab } = useProvidersFilter(providersByCategory);

  if (!ethStakingProviders?.enabled) {
    return null;
  }

  const onClose = () => {
    console.log("dispatch close drawer");
    setDrawer();
  };

  return (
    <SideDrawer isOpen direction="left" title="Test EVM Side drawer" onRequestClose={onClose}>
      <Flex flexDirection={"column"}>
        <TrackPage category="ETH Stake Modal" name="Main Modal" />

        <ProvidersFilterTabs providers={providersByCategory} changeTab={changeTab} />
        <EthStakingModalBody
          onClose={onClose}
          account={account}
          hasCheckbox={hasCheckbox}
          singleProviderRedirectMode={singleProviderRedirectMode}
          source={source}
          listProviders={providersByCategory[activeKey]}
        />
      </Flex>
    </SideDrawer>
  );
};

export default EVMStakingDrawer;

export type ProvidersByFilter = Record<string, Provider[]>;

export type Provider = {
  id: string;
  name: string;
  liveAppId: string;
  supportLink?: string;
  icon?: string;
  queryParams?: Record<string, string>;
};

export function useProvidersFilter(providersMap: ProvidersByFilter) {
  const [activeIndex, setActiveIndex] = useState(0);

  const changeTab = useCallback((activeIndex: number) => setActiveIndex(activeIndex), []);

  const categories = Object.keys(providersMap);
  const activeKey = categories[activeIndex];

  return {
    activeKey,
    changeTab,
  };
}

type ProvidersFilterProps = {
  changeTab: (nextIndex: number) => void;
  providers: ProvidersByFilter;
};

export function ProvidersFilterTabs({ changeTab, providers }: ProvidersFilterProps) {
  return (
    <Chip onTabChange={i => changeTab(i)} initialActiveIndex={0} data-test-id={`date-tabs`}>
      {Object.keys(providers).map(key => (
        <Text whiteSpace="nowrap" textTransform="uppercase" key={key}>
          {key}
        </Text>
      ))}
    </Chip>
  );
}
