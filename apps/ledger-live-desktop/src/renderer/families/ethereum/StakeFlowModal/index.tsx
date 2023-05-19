import React from "react";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { EthStakingProviders } from "~/types/featureFlags";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { Trans } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { EthStakingModalBody } from "./EthStakingModalBody";

type Props = {
  name: string;
  account: Account;
  checkbox?: boolean;
  singleProviderRedirectMode?: boolean;
  source?: string;
};
const DelegationModal = ({
  name,
  account,
  checkbox,
  singleProviderRedirectMode,
  source,
}: Props) => {
  const ethStakingProviders = useFeature<EthStakingProviders>("ethStakingProviders");

  if (!ethStakingProviders?.enabled) return null;

  return (
    <Modal
      name={name}
      centered
      width={500}
      render={({ onClose }) => (
        <ModalBody
          title={<Trans i18nKey="ethereum.stake.title" />}
          onClose={onClose}
          render={() => (
            <Flex justifyContent={"center"}>
              <TrackPage category="ETH Stake Modal" name="Main Modal" />
              <EthStakingModalBody
                onClose={onClose}
                account={account}
                checkbox={checkbox}
                singleProviderRedirectMode={singleProviderRedirectMode}
                source={source}
                listProviders={ethStakingProviders.params?.listProvider}
              />
            </Flex>
          )}
        />
      )}
    />
  );
};
export default DelegationModal;
