import React from "react";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { EthStakingProviders } from "~/types/featureFlags";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { Flex } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { EthStakingModalBody } from "./EthStakingModalBody";

type Props = {
  account: Account;
  singleProviderRedirectMode?: boolean;
  source?: string;
};
const DelegationModal = ({ account, singleProviderRedirectMode, source }: Props) => {
  const ethStakingProviders = useFeature<EthStakingProviders>("ethStakingProviders");

  if (!ethStakingProviders?.enabled) return null;

  return (
    <Modal
      name="MODAL_ETH_STAKE"
      centered
      width={500}
      render={({ onClose }) => (
        <ModalBody
          pt={0}
          onClose={onClose}
          render={() => (
            <Flex justifyContent={"center"}>
              <TrackPage category="ETH Stake Modal" name="Main Modal" />
              <EthStakingModalBody
                onClose={onClose}
                account={account}
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
