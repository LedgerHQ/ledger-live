import React from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { Flex } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { EthStakingModalBody } from "./EthStakingModalBody";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";

type Props = {
  account: WalletAPIAccount;
  singleProviderRedirectMode?: boolean;
  /** Analytics source */
  source?: string;
  hasCheckbox?: boolean;
};

const StakingModal = ({ account, hasCheckbox, singleProviderRedirectMode, source }: Props) => {
  const ethStakingProviders = useFeature("ethStakingProviders");
  const providers = ethStakingProviders?.params?.listProvider;

  if (!ethStakingProviders?.enabled) {
    return null;
  }

  return (
    <Modal
      name="MODAL_EVM_STAKE"
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
                hasCheckbox={hasCheckbox}
                singleProviderRedirectMode={singleProviderRedirectMode}
                source={source}
                listProviders={providers}
              />
            </Flex>
          )}
        />
      )}
    />
  );
};

export default StakingModal;
